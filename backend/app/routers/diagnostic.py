from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.session import TutoringSession
from app.models.diagnostic import DiagnosticQuestion, SubTopicProficiency
from app.schemas.diagnostic import (
    DiagnosticGenerateRequest, QuestionOut, DiagnosticSubmit,
    SubTopicProficiencyOut, DiagnosticCompleteOut
)
from app.services.diagnostic_service import DiagnosticService

router = APIRouter(tags=["diagnostic"])


@router.post("/{session_id}/generate")
async def generate_questions(
    session_id: str,
    body: DiagnosticGenerateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc = DiagnosticService(db)
    questions = await svc.generate_questions(session_id, body.topic, body.sub_topics)
    return {"generated": len(questions)}


@router.get("/{session_id}/questions", response_model=list[QuestionOut])
async def get_questions(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(DiagnosticQuestion)
        .where(DiagnosticQuestion.session_id == session_id)
        .order_by(DiagnosticQuestion.sequence_order)
    )
    return result.scalars().all()


@router.post("/{session_id}/submit", response_model=DiagnosticCompleteOut)
async def submit_diagnostic(
    session_id: str,
    body: DiagnosticSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.models.diagnostic import DiagnosticResponse
    from datetime import datetime

    # Save all responses
    for ans in body.answers:
        q_result = await db.execute(select(DiagnosticQuestion).where(DiagnosticQuestion.id == ans.question_id))
        question = q_result.scalar_one_or_none()
        if not question:
            continue
        is_correct = ans.selected_index == question.correct_index
        quadrant = DiagnosticService.compute_quadrant(is_correct, ans.confidence)
        resp = DiagnosticResponse(
            session_id=session_id,
            question_id=ans.question_id,
            student_id=current_user.id,
            selected_index=ans.selected_index,
            is_correct=is_correct,
            confidence=ans.confidence,
            quadrant=quadrant,
            time_taken_ms=ans.time_taken_ms,
        )
        db.add(resp)
    await db.commit()

    svc = DiagnosticService(db)
    proficiency = await svc.compute_proficiency(session_id, current_user.id)
    contract = await svc.generate_session_contract(proficiency)

    sess_result = await db.execute(select(TutoringSession).where(TutoringSession.id == session_id))
    sess = sess_result.scalar_one_or_none()
    if sess:
        sess.session_contract = contract
        await db.commit()

    return DiagnosticCompleteOut(
        proficiency=[SubTopicProficiencyOut.model_validate(p) for p in proficiency],
        session_contract=contract,
    )


@router.get("/{session_id}/proficiency", response_model=list[SubTopicProficiencyOut])
async def get_proficiency(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(SubTopicProficiency).where(SubTopicProficiency.session_id == session_id)
    )
    return result.scalars().all()
