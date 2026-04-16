from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class AnalogyGenerateRequest(BaseModel):
    session_id: str


class AnalogyOut(BaseModel):
    id: str
    session_id: str
    spatial_analogy: str
    social_analogy: str
    abstract_analogy: str
    sent_to_student: bool
    student_selection: Optional[str] = None
    analogy_worked: Optional[bool] = None
    created_at: datetime

    class Config:
        from_attributes = True
