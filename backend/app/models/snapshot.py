import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text, ForeignKey, BigInteger
from app.database import Base


class Snapshot(Base):
    __tablename__ = "snapshots"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String, ForeignKey("tutoring_sessions.id"), nullable=False)
    student_id = Column(String, ForeignKey("users.id"), nullable=False)
    whiteboard_png = Column(Text, nullable=True)
    transcript_snippet = Column(Text, nullable=True)
    timestamp_ms = Column(BigInteger, nullable=False)
    ai_context_tag = Column(Text, nullable=True)
    tutor_intent = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
