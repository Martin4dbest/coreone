from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.user import User

from app.modules.auth.dependencies.current_user import get_current_user

from app.core.tenant.context import TenantContext
from app.core.tenant.dependencies import get_tenant_from_request

from app.modules.attendance.schemas import (
    AttendanceCreateRequest,
    AttendanceResponse,
)

from app.modules.attendance.service import AttendanceService


router = APIRouter(
    prefix="/attendance",
    tags=["Attendance"],
)


@router.post(
    "",
    response_model=AttendanceResponse,
)
async def create_attendance(
    payload: AttendanceCreateRequest,
    db: AsyncSession = Depends(get_db),
    tenant: TenantContext = Depends(get_tenant_from_request),
    current_user: User = Depends(get_current_user),
):

    return await AttendanceService(db).create_attendance(
        payload,
        current_user,
        tenant,
    )


@router.get(
    "",
    response_model=list[AttendanceResponse],
)
async def get_attendance(
    db: AsyncSession = Depends(get_db),
    tenant: TenantContext = Depends(get_tenant_from_request),
    current_user: User = Depends(get_current_user),
):

    return await AttendanceService(db).get_attendance(
        current_user,
        tenant,
    )


@router.get(
    "/{attendance_id}",
    response_model=AttendanceResponse,
)
async def get_attendance_by_id(
    attendance_id: int,
    db: AsyncSession = Depends(get_db),
    tenant: TenantContext = Depends(get_tenant_from_request),
    current_user: User = Depends(get_current_user),
):

    return await AttendanceService(db).get_attendance_by_id(
        attendance_id,
        current_user,
        tenant,
    )
