import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text, ForeignKey, BigInteger, Boolean
from app.database import Base


class ParkedQuestion(Base):
    __tablename__ = "parked_questions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String, ForeignKey("tutoring_sessions.id"), nullable=False)
    student_id = Column(String, ForeignKey("users.id"), nullable=False)
    transcript_context = Column(Text, nullable=True)
    timestamp_ms = Column(BigInteger, nullable=False)
    is_resolved = Column(Boolean, default=False)
    resolution_note = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
