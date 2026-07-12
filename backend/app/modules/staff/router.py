from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.permissions import require_roles
from app.db.database import get_db
from app.models.user import User
from app.modules.auth.dependencies.current_user import get_current_user
from app.modules.staff.schemas import (
    StaffCreateRequest,
    StaffResponse,
)
from app.modules.staff.service import StaffService


router = APIRouter(
    prefix="/staff",
    tags=["Staff"],
)


@router.post(
    "",
    response_model=StaffResponse,
)
async def create_staff(
    payload: StaffCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("SUPER_ADMIN", "SCHOOL_ADMIN")),
):
    return await StaffService(db).create_staff(
        payload,
        current_user,
    )


@router.get(
    "",
    response_model=list[StaffResponse],
)
async def get_staff(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("SUPER_ADMIN", "SCHOOL_ADMIN")),
):
    return await StaffService(db).get_staff(
        current_user
    )


@router.get(
    "/{staff_id}",
    response_model=StaffResponse,
)
async def get_staff_member(
    staff_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("SUPER_ADMIN", "SCHOOL_ADMIN")),
):
    return await StaffService(db).get_staff_member(
        staff_id,
        current_user,
    )
