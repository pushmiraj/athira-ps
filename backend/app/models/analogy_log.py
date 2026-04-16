import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text, ForeignKey, Boolean
from app.database import Base


class AnalogyLog(Base):
    __tablename__ = "analogy_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String, ForeignKey("tutoring_sessions.id"), nullable=False)
    tutor_id = Column(String, ForeignKey("users.id"), nullable=False)
    trigger_transcript = Column(Text, nullable=True)
    spatial_analogy = Column(Text, nullable=False)
    social_analogy = Column(Text, nullable=False)
    abstract_analogy = Column(Text, nullable=False)
    sent_to_student = Column(Boolean, default=False)
    student_selection = Column(String(20), nullable=True)
    analogy_worked = Column(Boolean, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
