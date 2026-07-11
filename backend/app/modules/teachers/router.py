from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.modules.auth.dependencies.current_user import get_current_user
from app.modules.teachers.schemas import (
    TeacherCreateRequest,
    TeacherResponse,
)
from app.modules.teachers.service import TeacherService

router = APIRouter(
    prefix="/teachers",
    tags=["Teachers"],
)


@router.get(
    "",
    response_model=list[TeacherResponse],
)
async def get_teachers(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await TeacherService(db).get_teachers()


@router.get(
    "/{teacher_id}",
    response_model=TeacherResponse,
)
async def get_teacher(
    teacher_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await TeacherService(db).get_teacher(
        teacher_id
    )


@router.post(
    "",
    response_model=TeacherResponse,
)
async def create_teacher(
    payload: TeacherCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await TeacherService(db).create_teacher(
        payload
    )
