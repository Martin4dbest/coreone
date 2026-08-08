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
    return await AcademicSessionService(db).create_session(
        payload,
        current_user,
    )


@router.get(
    "",
    response_model=list[AcademicSessionResponse],
)
async def get_sessions(
    school_id: int | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await AcademicSessionService(db).get_sessions(
        current_user,
        school_id,
    )


@router.get(
    "/{session_id}",
    response_model=AcademicSessionResponse,
)
async def get_session(
    session_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await AcademicSessionService(db).get_session(
        session_id,
        current_user,
    )


@router.patch(
    "/{session_id}/make-current",
    response_model=AcademicSessionResponse,
)
async def make_session_current(
    session_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await AcademicSessionService(db).make_current(
        session_id,
        current_user,
    )