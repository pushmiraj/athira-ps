import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text, ForeignKey, BigInteger
from app.database import Base


class TranscriptSegment(Base):
    __tablename__ = "transcript_segments"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String, ForeignKey("tutoring_sessions.id"), nullable=False)
    speaker_id = Column(String, ForeignKey("users.id"), nullable=False)
    speaker_role = Column(String(10), nullable=False)
    text = Column(Text, nullable=False)
    timestamp_ms = Column(BigInteger, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
