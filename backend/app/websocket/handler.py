from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import time

from app.websocket.manager import manager
from app.services.auth_service import decode_token
from app.database import AsyncSessionLocal
from app.models.user import User
from app.models.snapshot import Snapshot
from app.models.parked_question import ParkedQuestion
from app.models.reflection import ReflectionNote
from app.models.analogy_log import AnalogyLog
from app.models.transcript import TranscriptSegment
from app.models.diagnostic import DiagnosticQuestion, DiagnosticResponse, SubTopicProficiency
from app.models.session import TutoringSession

router = APIRouter(tags=["websocket"])


async def _get_user_from_token(token: str) -> dict | None:
    payload = decode_token(token)
    if not payload:
        return None
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.id == payload.get("sub")))
        user = result.scalar_one_or_none()
        if not user:
            return None
        return {"id": user.id, "role": user.role, "name": user.name}


@router.websocket("/ws/{session_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    session_id: str,
    token: str = Query(...),
):
    user = await _get_user_from_token(token)
    if not user:
        await websocket.close(code=4001)
        return

    user["conn_id"] = str(id(websocket))
    await manager.connect(session_id, user["id"], user["role"], user["name"], websocket)

    # Notify others that this participant joined
    await manager.broadcast(
        session_id,
        "PARTICIPANT_JOINED",
        {"user_id": user["id"], "role": user["role"], "name": user["name"]},
        exclude_conn_id=user["conn_id"],
    )

    # Send current participants list to the new joiner
    await manager.send_to_user(
        session_id, user["id"],
        "SESSION_PARTICIPANTS",
        {"participants": manager.get_participants(session_id)},
    )

    try:
        while True:
            data = await websocket.receive_json()
            event = data.get("event", "")
            payload = data.get("payload", {})

            match event:
                case "DIAGNOSTIC_ANSWER_SUBMITTED":
                    await handle_diag_answer(data, session_id, user)

                case "SNAPSHOT_TAKEN":
                    await handle_snapshot(data, session_id, user)

                case "TUTOR_INTENT_ADDED":
                    await handle_intent(data, session_id, user)

                case "QUESTION_PARKED":
                    await handle_park(data, session_id, user)

                case "REFLECTION_SAVED":
                    await handle_reflection(data, session_id, user)

                case "ANALOGY_REQUESTED":
                    await handle_analogy_request(data, session_id, user)

                case "ANALOGY_POLL_SEND":
                    await handle_analogy_poll_send(data, session_id, user)

                case "ANALOGY_SELECTED":
                    await handle_analogy_selected(data, session_id, user)

                case "ANALOGY_WORKED":
                    await handle_analogy_worked(data, session_id, user)

                case "TRANSCRIPT_SEGMENT":
                    await handle_transcript(data, session_id, user)

                case "WHITEBOARD_DELTA":
                    await handle_whiteboard(data, session_id, user)

                case "SESSION_STATUS_CHANGED":
                    await manager.broadcast(session_id, "SESSION_STATUS_CHANGED", payload)

                # ─── WebRTC Signaling (relay to other peer) ─────────────
                case "WEBRTC_OFFER":
                    await manager.broadcast(session_id, "WEBRTC_OFFER", payload, exclude_conn_id=user["conn_id"])

                case "WEBRTC_ANSWER":
                    await manager.broadcast(session_id, "WEBRTC_ANSWER", payload, exclude_conn_id=user["conn_id"])

                case "WEBRTC_ICE_CANDIDATE":
                    await manager.broadcast(session_id, "WEBRTC_ICE_CANDIDATE", payload, exclude_conn_id=user["conn_id"])

                # ─── Text Editor Syncing ─────────────
                case "TEXT_EDITOR_DELTA":
                    await manager.broadcast(session_id, "TEXT_EDITOR_UPDATE", payload, exclude_conn_id=user["conn_id"])

                case _:
                    pass  # Unknown event — ignore

    except WebSocketDisconnect:
        await manager.disconnect(session_id, user["id"])
        await manager.broadcast(
            session_id,
            "PARTICIPANT_LEFT",
            {"user_id": user["id"], "role": user["role"]},
        )


# ─── Feature 1: Diagnostic ───────────────────────────────────────────────────

async def handle_diag_answer(data: dict, session_id: str, user: dict):
    try:
        from app.services.diagnostic_service import DiagnosticService
        payload = data.get("payload", {})
        question_id = payload.get("question_id")
        selected_index = payload.get("selected_index")
        confidence = payload.get("confidence", 3)
        time_taken_ms = payload.get("time_taken_ms")

        async with AsyncSessionLocal() as db:
            # Load question
            q_result = await db.execute(select(DiagnosticQuestion).where(DiagnosticQuestion.id == question_id))
            question = q_result.scalar_one_or_none()
            if not question:
                with open("ws_error.log", "a") as f:
                    f.write(f"Question not found: {question_id}\n")
                return

            is_correct = (selected_index == question.correct_index)
            quadrant = DiagnosticService.compute_quadrant(is_correct, confidence)

            response = DiagnosticResponse(
                session_id=session_id,
                question_id=question_id,
                student_id=user["id"],
                selected_index=selected_index,
                is_correct=is_correct,
                confidence=confidence,
                quadrant=quadrant,
                time_taken_ms=time_taken_ms,
            )
            db.add(response)
            await db.commit()
    except Exception as e:
        import traceback
        with open("ws_error.log", "a") as f:
            f.write(f"Exception in handle_diag_answer: {str(e)}\n")
            f.write(traceback.format_exc() + "\n")
        raise

        # Count answers so far
        from sqlalchemy import func
        count_result = await db.execute(
            select(func.count()).where(
                DiagnosticResponse.session_id == session_id,
                DiagnosticResponse.student_id == user["id"],
            )
        )
        answered = count_result.scalar()

        total_result = await db.execute(
            select(func.count()).where(DiagnosticQuestion.session_id == session_id)
        )
        total = total_result.scalar()

        # Send progress to tutor
        await manager.send_to_role(session_id, "tutor", "DIAGNOSTIC_PROGRESS", {
            "answered": answered, "total": total,
            "last_quadrant": quadrant, "sub_topic": question.sub_topic,
        })

        # If all answered, compute proficiency + contract
        if answered >= total:
            svc = DiagnosticService(db)
            proficiency = await svc.compute_proficiency(session_id, user["id"])
            contract = await svc.generate_session_contract(proficiency)

            # Save contract to session
            sess_result = await db.execute(select(TutoringSession).where(TutoringSession.id == session_id))
            sess = sess_result.scalar_one_or_none()
            if sess:
                sess.session_contract = contract
                sess.status = "live"
                await db.commit()

            proficiency_out = [
                {
                    "sub_topic": p.sub_topic,
                    "quadrant": p.quadrant,
                    "traffic_light": p.traffic_light,
                    "avg_confidence": p.avg_confidence,
                    "correct_count": p.correct_count,
                    "total_count": p.total_count,
                }
                for p in proficiency
            ]

            await manager.send_to_role(session_id, "tutor", "DIAGNOSTIC_COMPLETE", {
                "proficiency": proficiency_out,
                "session_contract": contract,
            })
            await manager.broadcast(session_id, "SESSION_STATUS_CHANGED", {
                "new_status": "live",
                "session_contract": contract,
            })


# ─── Feature 2: Sidecar ───────────────────────────────────────────────────────

async def handle_snapshot(data: dict, session_id: str, user: dict):
    from app.services.analogy_service import generate_context_tag
    payload = data.get("payload", {})
    whiteboard_png = payload.get("whiteboard_png")
    transcript_snippet = payload.get("transcript_snippet", "")
    timestamp_ms = payload.get("timestamp_ms", int(time.time() * 1000))

    # Generate AI context tag
    context_tag = await generate_context_tag(transcript_snippet)

    async with AsyncSessionLocal() as db:
        snapshot = Snapshot(
            session_id=session_id,
            student_id=user["id"],
            whiteboard_png=whiteboard_png,
            transcript_snippet=transcript_snippet,
            timestamp_ms=timestamp_ms,
            ai_context_tag=context_tag,
        )
        db.add(snapshot)
        await db.commit()
        await db.refresh(snapshot)

        snapshot_id = snapshot.id

    # Prompt tutor for intent tag (10-second window)
    await manager.send_to_role(session_id, "tutor", "TUTOR_INTENT_PROMPT", {
        "snapshot_id": snapshot_id,
        "student_name": user["name"],
        "context_tag": context_tag,
    })

    # Confirm snapshot to student
    await manager.send_to_user(session_id, user["id"], "SNAPSHOT_CONFIRMED", {
        "snapshot_id": snapshot_id,
        "ai_context_tag": context_tag,
        "timestamp_ms": timestamp_ms,
    })


async def handle_intent(data: dict, session_id: str, user: dict):
    payload = data.get("payload", {})
    snapshot_id = payload.get("snapshot_id")
    intent_text = payload.get("intent_text", "")

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Snapshot).where(Snapshot.id == snapshot_id))
        snapshot = result.scalar_one_or_none()
        if snapshot:
            snapshot.tutor_intent = intent_text
            await db.commit()
            student_id = snapshot.student_id

    await manager.send_to_user(session_id, student_id, "SNAPSHOT_ENRICHED", {
        "snapshot_id": snapshot_id,
        "tutor_intent": intent_text,
    })


async def handle_park(data: dict, session_id: str, user: dict):
    payload = data.get("payload", {})
    transcript_context = payload.get("transcript_context", "")
    timestamp_ms = payload.get("timestamp_ms", int(time.time() * 1000))

    async with AsyncSessionLocal() as db:
        pq = ParkedQuestion(
            session_id=session_id,
            student_id=user["id"],
            transcript_context=transcript_context,
            timestamp_ms=timestamp_ms,
        )
        db.add(pq)
        await db.commit()
        await db.refresh(pq)
        pq_id = pq.id

    await manager.send_to_user(session_id, user["id"], "QUESTION_PARKED_CONFIRMED", {
        "parked_id": pq_id,
        "timestamp_ms": timestamp_ms,
    })


async def handle_reflection(data: dict, session_id: str, user: dict):
    payload = data.get("payload", {})
    content = payload.get("content", "")
    timestamp_ms = payload.get("timestamp_ms", int(time.time() * 1000))

    async with AsyncSessionLocal() as db:
        note = ReflectionNote(
            session_id=session_id,
            student_id=user["id"],
            content=content,
            timestamp_ms=timestamp_ms,
        )
        db.add(note)
        await db.commit()


# ─── Feature 3: Analogy Engine ───────────────────────────────────────────────

async def handle_analogy_request(data: dict, session_id: str, user: dict):
    from app.services.analogy_service import AnalogyService
    if user["role"] != "tutor":
        return

    transcript_text = manager.get_last_n_transcript_text(session_id, n=20)

    try:
        analogies = await AnalogyService.generate_analogies(transcript_text)
    except Exception as e:
        await manager.send_to_user(session_id, user["id"], "ANALOGY_ERROR", {
            "message": "Analogy generation failed, try again"
        })
        return

    async with AsyncSessionLocal() as db:
        log = AnalogyLog(
            session_id=session_id,
            tutor_id=user["id"],
            trigger_transcript=transcript_text[:2000],
            spatial_analogy=analogies["spatial"],
            social_analogy=analogies["social"],
            abstract_analogy=analogies["abstract"],
        )
        db.add(log)
        await db.commit()
        await db.refresh(log)
        log_id = log.id

    await manager.send_to_user(session_id, user["id"], "ANALOGIES_READY", {
        "analogy_log_id": log_id,
        "spatial": analogies["spatial"],
        "social": analogies["social"],
        "abstract": analogies["abstract"],
    })


async def handle_analogy_poll_send(data: dict, session_id: str, user: dict):
    payload = data.get("payload", {})
    analogy_log_id = payload.get("analogy_log_id")

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(AnalogyLog).where(AnalogyLog.id == analogy_log_id))
        log = result.scalar_one_or_none()
        if not log:
            return
        log.sent_to_student = True
        await db.commit()
        analogies = {
            "spatial": log.spatial_analogy,
            "social": log.social_analogy,
            "abstract": log.abstract_analogy,
        }

    await manager.send_to_role(session_id, "student", "ANALOGY_POLL_RECEIVED", {
        "analogy_log_id": analogy_log_id,
        **analogies,
    })


async def handle_analogy_selected(data: dict, session_id: str, user: dict):
    payload = data.get("payload", {})
    analogy_log_id = payload.get("analogy_log_id")
    selection = payload.get("selection")

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(AnalogyLog).where(AnalogyLog.id == analogy_log_id))
        log = result.scalar_one_or_none()
        if log:
            log.student_selection = selection
            await db.commit()

    await manager.send_to_role(session_id, "tutor", "ANALOGY_SELECTION_RECEIVED", {
        "analogy_log_id": analogy_log_id,
        "selection": selection,
    })


async def handle_analogy_worked(data: dict, session_id: str, user: dict):
    payload = data.get("payload", {})
    analogy_log_id = payload.get("analogy_log_id")

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(AnalogyLog).where(AnalogyLog.id == analogy_log_id))
        log = result.scalar_one_or_none()
        if log:
            log.analogy_worked = True
            await db.commit()


# ─── Transcript ───────────────────────────────────────────────────────────────

async def handle_transcript(data: dict, session_id: str, user: dict):
    payload = data.get("payload", {})
    text = payload.get("text", "")
    is_final = payload.get("is_final", True)
    timestamp_ms = int(time.time() * 1000)

    if is_final and text.strip():
        manager.append_transcript(session_id, {
            "speaker_id": user["id"],
            "speaker_role": user["role"],
            "text": text,
            "timestamp_ms": timestamp_ms,
        })
        # Persist final segments asynchronously
        async with AsyncSessionLocal() as db:
            seg = TranscriptSegment(
                session_id=session_id,
                speaker_id=user["id"],
                speaker_role=user["role"],
                text=text,
                timestamp_ms=timestamp_ms,
            )
            db.add(seg)
            await db.commit()

    # Broadcast to all other participants
    await manager.broadcast(session_id, "TRANSCRIPT_BROADCAST", {
        "speaker_id": user["id"],
        "speaker_role": user["role"],
        "text": text,
        "timestamp_ms": timestamp_ms,
        "is_final": is_final,
    }, exclude_conn_id=user["conn_id"])


# ─── Whiteboard ───────────────────────────────────────────────────────────────

async def handle_whiteboard(data: dict, session_id: str, user: dict):
    payload = data.get("payload", {})
    # Relay to all other participants
    await manager.broadcast(session_id, "WHITEBOARD_UPDATE", payload, exclude_conn_id=user["conn_id"])
