import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text, ForeignKey, JSON
from app.database import Base


class TutoringSession(Base):
    __tablename__ = "tutoring_sessions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    student_id = Column(String, ForeignKey("users.id"), nullable=False)
    tutor_id = Column(String, ForeignKey("users.id"), nullable=False)
    topic = Column(String(500), nullable=False)
    sub_topics = Column(JSON, nullable=True)
    status = Column(String(20), default="scheduled")
    session_contract = Column(Text, nullable=True)
    scheduled_at = Column(DateTime, nullable=False)
    started_at = Column(DateTime, nullable=True)
    ended_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
