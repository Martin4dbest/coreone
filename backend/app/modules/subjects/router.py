from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.user import User
from app.modules.auth.dependencies.current_user import get_current_user
from app.modules.subjects.schemas import (
    SubjectCreateRequest,
    SubjectResponse,
)
from app.modules.subjects.service import SubjectService


router = APIRouter(
    prefix="/subjects",
    tags=["Subjects"],
)


@router.post(
    "",
    response_model=SubjectResponse,
)
async def create_subject(
    payload: SubjectCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await SubjectService(db).create_subject(payload, current_user)


@router.get(
    "",
    response_model=list[SubjectResponse],
)
async def get_subjects(
    school_id: int | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await SubjectService(db).get_subjects(current_user)


@router.get(
    "/{subject_id}",
    response_model=SubjectResponse,
)
async def get_subject(
    subject_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await SubjectService(db).get_subject(subject_id, current_user)
