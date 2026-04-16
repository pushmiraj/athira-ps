from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.session import TutoringSession
from app.models.snapshot import Snapshot
from app.models.parked_question import ParkedQuestion
from app.models.reflection import ReflectionNote
from app.models.diagnostic import SubTopicProficiency


class StudyPackService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def compile(self, session_id: str) -> dict:
        # Session details
        sess_result = await self.db.execute(select(TutoringSession).where(TutoringSession.id == session_id))
        session = sess_result.scalar_one_or_none()

        # Proficiency
        prof_result = await self.db.execute(
            select(SubTopicProficiency).where(SubTopicProficiency.session_id == session_id)
        )
        proficiency = prof_result.scalars().all()

        # Snapshots
        snap_result = await self.db.execute(
            select(Snapshot).where(Snapshot.session_id == session_id).order_by(Snapshot.timestamp_ms)
        )
        snapshots = snap_result.scalars().all()

        # Parked questions
        pq_result = await self.db.execute(
            select(ParkedQuestion).where(ParkedQuestion.session_id == session_id).order_by(ParkedQuestion.timestamp_ms)
        )
        parked = pq_result.scalars().all()

        # Reflection notes
        rn_result = await self.db.execute(
            select(ReflectionNote).where(ReflectionNote.session_id == session_id).order_by(ReflectionNote.timestamp_ms)
        )
        notes = rn_result.scalars().all()

        return {
            "session_id": session_id,
            "topic": session.topic if session else "",
            "session_contract": session.session_contract if session else "",
            "proficiency": [
                {
                    "sub_topic": p.sub_topic,
                    "quadrant": p.quadrant,
                    "traffic_light": p.traffic_light,
                }
                for p in proficiency
            ],
            "snapshots": [
                {
                    "id": s.id,
                    "timestamp_ms": s.timestamp_ms,
                    "whiteboard_png": s.whiteboard_png,
                    "transcript_snippet": s.transcript_snippet,
                    "ai_context_tag": s.ai_context_tag,
                    "tutor_intent": s.tutor_intent,
                }
                for s in snapshots
            ],
            "parked_questions": [
                {
                    "id": p.id,
                    "timestamp_ms": p.timestamp_ms,
                    "transcript_context": p.transcript_context,
                    "is_resolved": p.is_resolved,
                    "resolution_note": p.resolution_note,
                }
                for p in parked
            ],
            "reflection_notes": [
                {
                    "content": n.content,
                    "timestamp_ms": n.timestamp_ms,
                }
                for n in notes
            ],
        }

    async def render_html(self, session_id: str) -> str:
        data = await self.compile(session_id)
        snapshots_html = ""
        for i, s in enumerate(data["snapshots"], 1):
            img = f'<img src="{s["whiteboard_png"]}" style="max-width:100%;border-radius:8px;" />' if s["whiteboard_png"] else ""
            intent = f'<div class="intent">💬 Tutor: {s["tutor_intent"]}</div>' if s["tutor_intent"] else ""
            snapshots_html += f"""
            <div class="snapshot">
              <h4>📸 Snapshot {i} — {s['ai_context_tag'] or ''}</h4>
              {img}
              <p class="transcript">{s['transcript_snippet'] or ''}</p>
              {intent}
            </div>"""

        parked_html = "".join(
            f'<li>❓ {p["transcript_context"] or "Question parked at T+{:.0f}s".format(p["timestamp_ms"]/1000)}'
            f'{"  ✅ " + p["resolution_note"] if p["resolution_note"] else ""}</li>'
            for p in data["parked_questions"]
        )

        notes_html = "".join(
            f'<p>📝 {n["content"]}</p>' for n in data["reflection_notes"]
        )

        return f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Study Pack — {data['topic']}</title>
  <style>
    body {{ font-family: 'Segoe UI', sans-serif; max-width: 800px; margin: 40px auto; color: #0F172A; }}
    h1 {{ color: #2563EB; }} h2 {{ color: #1D4ED8; border-bottom: 2px solid #E2E8F0; padding-bottom: 8px; }}
    .contract {{ background: #EFF6FF; border-left: 4px solid #2563EB; padding: 12px 16px; border-radius: 4px; margin: 16px 0; }}
    .snapshot {{ background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px; margin: 12px 0; }}
    .intent {{ background: #F0FDF4; border-left: 3px solid #16A34A; padding: 8px 12px; margin-top: 8px; border-radius: 4px; }}
    .transcript {{ color: #64748B; font-size: 0.875rem; font-style: italic; }}
    ul {{ padding-left: 1.5rem; }} li {{ margin: 6px 0; }}
  </style>
</head>
<body>
  <h1>📚 Study Pack: {data['topic']}</h1>
  <div class="contract"><strong>Session Contract:</strong> {data['session_contract']}</div>
  <h2>📸 Snapshots ({len(data['snapshots'])})</h2>
  {snapshots_html or '<p>No snapshots captured.</p>'}
  <h2>🅿️ Parked Questions ({len(data['parked_questions'])})</h2>
  <ul>{parked_html or '<li>No questions parked.</li>'}</ul>
  <h2>📝 Reflection Notes</h2>
  {notes_html or '<p>No notes written.</p>'}
</body>
</html>"""
