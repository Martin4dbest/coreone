from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.core.permissions import require_roles
from app.db.database import get_db
from app.modules.auth.dependencies.current_user import get_current_user
from app.modules.teachers.schemas import (
    TeacherCreateRequest,
    TeacherResponse,
    TeacherAssignmentSummaryResponse,
)
from app.modules.teachers.dashboard_schemas import TeacherDashboardResponse
from app.modules.teachers.service import TeacherService
from app.modules.teachers.dashboard_service import TeacherDashboardService

router = APIRouter(
    prefix="/teachers",
    tags=["Teachers"],
)


@router.get(
    "",
    response_model=list[TeacherResponse],
)
async def get_teachers(
    school_id: int | None = None,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles("SUPER_ADMIN", "SCHOOL_ADMIN")),
):
    return await TeacherService(db).get_teachers(
        current_user,
        school_id,
    )


@router.post(
    "",
    response_model=TeacherResponse,
)
async def create_teacher(
    payload: TeacherCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles("SUPER_ADMIN", "SCHOOL_ADMIN")),
):
    return await TeacherService(db).create_teacher(
        payload,
        current_user,
    )


@router.get(
    "/dashboard",
    response_model=TeacherDashboardResponse,
)
async def teacher_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await TeacherDashboardService(db).get_dashboard(
        current_user
    )


@router.get(
    "/my/classes",
)
async def my_classes(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await TeacherDashboardService(db).get_dashboard(
        current_user
    )



@router.get(
    "/{teacher_id}",
    response_model=TeacherResponse,
)
async def get_teacher(
    teacher_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles("SUPER_ADMIN", "SCHOOL_ADMIN")),
):
    return await TeacherService(db).get_teacher(
        teacher_id,
        current_user,
    )


@router.get(
    "/{teacher_id}/assignments",
    response_model=TeacherAssignmentSummaryResponse,
)
async def teacher_assignments(
    teacher_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(
        require_roles(
            "SUPER_ADMIN",
            "SCHOOL_ADMIN",
        )
    ),
):
    return await TeacherService(db).get_teacher_assignments_summary(
        teacher_id,
        current_user,
    )