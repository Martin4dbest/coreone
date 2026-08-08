from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.user import User
from app.modules.auth.dependencies.current_user import get_current_user

from app.modules.class_teachers.repository import (
    ClassTeacherRepository,
)

from app.modules.class_teachers.service import (
    ClassTeacherService,
)


router = APIRouter(
    prefix="/class-teachers",
    tags=["Class Teachers"],
)


@router.get(
    "/dashboard",
    status_code=status.HTTP_200_OK,
)
async def class_teacher_dashboard(
    term_id: int,
    session_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    repository = ClassTeacherRepository(db)

    service = ClassTeacherService(
        repository
    )

    return await service.get_dashboard(
        current_user,
        term_id,
        session_id,
    )