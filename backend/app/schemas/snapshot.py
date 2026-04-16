from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class SnapshotCreate(BaseModel):
    session_id: str
    whiteboard_png: Optional[str] = None
    transcript_snippet: Optional[str] = None
    timestamp_ms: int


class SnapshotOut(BaseModel):
    id: str
    session_id: str
    student_id: str
    whiteboard_png: Optional[str] = None
    transcript_snippet: Optional[str] = None
    timestamp_ms: int
    ai_context_tag: Optional[str] = None
    tutor_intent: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class TutorIntentUpdate(BaseModel):
    intent_text: str


class ParkedQuestionCreate(BaseModel):
    session_id: str
    transcript_context: Optional[str] = None
    timestamp_ms: int


class ParkedQuestionOut(BaseModel):
    id: str
    session_id: str
    student_id: str
    transcript_context: Optional[str] = None
    timestamp_ms: int
    is_resolved: bool
    resolution_note: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ResolveParkedQuestion(BaseModel):
    resolution_note: str
