from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.snapshot import Snapshot
from app.models.parked_question import ParkedQuestion
from app.schemas.snapshot import (
    SnapshotCreate, SnapshotOut, TutorIntentUpdate,
    ParkedQuestionCreate, ParkedQuestionOut, ResolveParkedQuestion
)
import time

router = APIRouter(tags=["snapshots"])


@router.post("/snapshots", response_model=SnapshotOut)
async def create_snapshot(
    body: SnapshotCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    snapshot = Snapshot(
        session_id=body.session_id,
        student_id=current_user.id,
        whiteboard_png=body.whiteboard_png,
        transcript_snippet=body.transcript_snippet,
        timestamp_ms=body.timestamp_ms,
    )
    db.add(snapshot)
    await db.commit()
    await db.refresh(snapshot)
    return snapshot


@router.get("/snapshots/{session_id}", response_model=list[SnapshotOut])
async def get_snapshots(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Snapshot)
        .where(Snapshot.session_id == session_id, Snapshot.student_id == current_user.id)
        .order_by(Snapshot.timestamp_ms)
    )
    return result.scalars().all()


@router.patch("/snapshots/{snapshot_id}/intent", response_model=SnapshotOut)
async def add_tutor_intent(
    snapshot_id: str,
    body: TutorIntentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Snapshot).where(Snapshot.id == snapshot_id))
    snapshot = result.scalar_one_or_none()
    if not snapshot:
        raise HTTPException(status_code=404, detail="Snapshot not found")
    snapshot.tutor_intent = body.intent_text
    await db.commit()
    await db.refresh(snapshot)
    return snapshot


@router.post("/parked-questions", response_model=ParkedQuestionOut)
async def park_question(
    body: ParkedQuestionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    pq = ParkedQuestion(
        session_id=body.session_id,
        student_id=current_user.id,
        transcript_context=body.transcript_context,
        timestamp_ms=body.timestamp_ms,
    )
    db.add(pq)
    await db.commit()
    await db.refresh(pq)
    return pq


@router.get("/parked-questions/{session_id}", response_model=list[ParkedQuestionOut])
async def get_parked_questions(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(ParkedQuestion)
        .where(ParkedQuestion.session_id == session_id)
        .order_by(ParkedQuestion.timestamp_ms)
    )
    return result.scalars().all()


@router.patch("/parked-questions/{pq_id}/resolve", response_model=ParkedQuestionOut)
async def resolve_parked_question(
    pq_id: str,
    body: ResolveParkedQuestion,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(ParkedQuestion).where(ParkedQuestion.id == pq_id))
    pq = result.scalar_one_or_none()
    if not pq:
        raise HTTPException(status_code=404, detail="Parked question not found")
    pq.is_resolved = True
    pq.resolution_note = body.resolution_note
    await db.commit()
    await db.refresh(pq)
    return pq
