from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class SessionCreate(BaseModel):
    tutor_id: str
    topic: str
    sub_topics: Optional[List[str]] = None
    scheduled_at: datetime


class SessionOut(BaseModel):
    id: str
    student_id: str
    tutor_id: str
    topic: str
    sub_topics: Optional[List[str]] = None
    status: str
    session_contract: Optional[str] = None
    scheduled_at: datetime
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class SessionStatusUpdate(BaseModel):
    status: str
