from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.user import User
from app.modules.auth.dependencies.current_user import get_current_user
from app.modules.academic_sessions.schemas import (
    AcademicSessionCreateRequest,
    AcademicSessionResponse,
)
from app.modules.academic_sessions.service import AcademicSessionService

router = APIRouter(
    prefix="/academic-sessions",
    tags=["Academic Sessions"],
)


@router.post(
    "",
    response_model=AcademicSessionResponse,
)
async def create_session(
    payload: AcademicSessionCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await AcademicSessionService(db).create_session(payload)


@router.get(
    "",
    response_model=list[AcademicSessionResponse],
)
async def get_sessions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await AcademicSessionService(db).get_sessions()


@router.get(
    "/{session_id}",
    response_model=AcademicSessionResponse,
)
async def get_session(
    session_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await AcademicSessionService(db).get_session(session_id)
