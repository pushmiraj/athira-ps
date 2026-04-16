from pydantic import BaseModel
from typing import List, Optional


class DiagnosticGenerateRequest(BaseModel):
    topic: str
    sub_topics: List[str]


class QuestionOut(BaseModel):
    id: str
    sub_topic: str
    question_text: str
    options: List[str]
    difficulty: Optional[str] = None
    sequence_order: int

    class Config:
        from_attributes = True


class AnswerSubmit(BaseModel):
    question_id: str
    selected_index: int
    confidence: int  # 1-5
    time_taken_ms: Optional[int] = None


class DiagnosticSubmit(BaseModel):
    answers: List[AnswerSubmit]


class SubTopicProficiencyOut(BaseModel):
    sub_topic: str
    quadrant: str
    traffic_light: str
    avg_confidence: Optional[float] = None
    correct_count: int
    total_count: int

    class Config:
        from_attributes = True


class DiagnosticCompleteOut(BaseModel):
    proficiency: List[SubTopicProficiencyOut]
    session_contract: str
