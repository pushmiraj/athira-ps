from fastapi import APIRouter, Depends
from fastapi.responses import HTMLResponse
from sqlalchemy.ext.asyncio import AsyncSession
from app.dependencies import get_db, get_current_user
from app.models.user import User
from app.services.study_pack_service import StudyPackService

router = APIRouter(tags=["study-pack"])


@router.get("/{session_id}")
async def get_study_pack(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc = StudyPackService(db)
    return await svc.compile(session_id)


@router.get("/{session_id}/export", response_class=HTMLResponse)
async def export_study_pack(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc = StudyPackService(db)
    html = await svc.render_html(session_id)
    return HTMLResponse(content=html)
