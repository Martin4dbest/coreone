from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.modules.auth.dependencies.current_user import get_current_user
from app.models.user import User

from app.modules.students.schemas import (
    StudentCreateRequest,
    StudentResponse,
)

from app.modules.students.service import StudentService

router = APIRouter(
    prefix="/students",
    tags=["Students"],
)


@router.post(
    "",
    response_model=StudentResponse,
)
async def create_student(
    payload: StudentCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await StudentService(db).create_student(payload)


@router.get(
    "",
    response_model=list[StudentResponse],
)
async def get_students(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await StudentService(db).get_students()


@router.get(
    "/{student_id}",
    response_model=StudentResponse,
)
async def get_student(
    student_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await StudentService(db).get_student(student_id)
