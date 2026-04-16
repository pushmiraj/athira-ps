from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from datetime import datetime
from app.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.session import TutoringSession
from app.schemas.session import SessionCreate, SessionOut, SessionStatusUpdate

router = APIRouter(tags=["sessions"])


@router.post("", response_model=SessionOut)
async def create_session(
    body: SessionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can book sessions")
    session = TutoringSession(
        student_id=current_user.id,
        tutor_id=body.tutor_id,
        topic=body.topic,
        sub_topics=body.sub_topics,
        scheduled_at=body.scheduled_at,
        status="scheduled",
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session


@router.get("", response_model=list[SessionOut])
async def list_sessions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role == "student":
        result = await db.execute(
            select(TutoringSession).where(TutoringSession.student_id == current_user.id)
        )
    else:
        result = await db.execute(
            select(TutoringSession).where(TutoringSession.tutor_id == current_user.id)
        )
    return result.scalars().all()


@router.get("/{session_id}", response_model=SessionOut)
async def get_session(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(TutoringSession).where(TutoringSession.id == session_id))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.student_id != current_user.id and session.tutor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    return session


@router.patch("/{session_id}/status", response_model=SessionOut)
async def update_status(
    session_id: str,
    body: SessionStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(TutoringSession).where(TutoringSession.id == session_id))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    session.status = body.status
    if body.status == "live" and not session.started_at:
        session.started_at = datetime.utcnow()
    if body.status == "completed":
        session.ended_at = datetime.utcnow()
    await db.commit()
    await db.refresh(session)
    return session
