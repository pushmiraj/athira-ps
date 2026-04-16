import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text, ForeignKey, JSON, Integer, Boolean, Float
from app.database import Base


class DiagnosticQuestion(Base):
    __tablename__ = "diagnostic_questions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String, ForeignKey("tutoring_sessions.id"), nullable=False)
    sub_topic = Column(String(255), nullable=False)
    question_text = Column(Text, nullable=False)
    options = Column(JSON, nullable=False)
    correct_index = Column(Integer, nullable=False)
    difficulty = Column(String(10), nullable=True)
    parent_question_id = Column(String, ForeignKey("diagnostic_questions.id"), nullable=True)
    branch_on_wrong = Column(String, ForeignKey("diagnostic_questions.id"), nullable=True)
    branch_on_right = Column(String, ForeignKey("diagnostic_questions.id"), nullable=True)
    sequence_order = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)


class DiagnosticResponse(Base):
    __tablename__ = "diagnostic_responses"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String, ForeignKey("tutoring_sessions.id"), nullable=False)
    question_id = Column(String, ForeignKey("diagnostic_questions.id"), nullable=False)
    student_id = Column(String, ForeignKey("users.id"), nullable=False)
    selected_index = Column(Integer, nullable=False)
    is_correct = Column(Boolean, nullable=False)
    confidence = Column(Integer, nullable=False)
    quadrant = Column(String(20), nullable=False)
    time_taken_ms = Column(Integer, nullable=True)
    answered_at = Column(DateTime, default=datetime.utcnow)


class SubTopicProficiency(Base):
    __tablename__ = "sub_topic_proficiency"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String, ForeignKey("tutoring_sessions.id"), nullable=False)
    sub_topic = Column(String(255), nullable=False)
    quadrant = Column(String(20), nullable=False)
    traffic_light = Column(String(10), nullable=False)
    avg_confidence = Column(Float, nullable=True)
    correct_count = Column(Integer, default=0)
    total_count = Column(Integer, default=0)
