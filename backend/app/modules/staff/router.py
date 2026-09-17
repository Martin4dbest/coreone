from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.permissions import require_roles
from app.db.database import get_db
from app.models.user import User
from app.modules.auth.dependencies.current_user import get_current_user
from app.modules.staff.schemas import (
    StaffCreateRequest,
    StaffResponse,
    StaffStatusResponse,
    StaffUpdateRequest,
)
from app.modules.staff.service import StaffService
from app.modules.staff.attendance_schemas import (
    StaffAttendanceCreateRequest,
    StaffAttendanceUpdateRequest,
    StaffAttendanceResponse,
)
from app.modules.staff.attendance_service import (
    StaffAttendanceService,
)
from app.modules.staff.leave_schemas import (
    StaffLeaveCreateRequest,
    StaffLeaveReviewRequest,
    StaffLeaveResponse,
)
from app.modules.staff.leave_service import StaffLeaveService


router = APIRouter(
    prefix="/staff",
    tags=["Staff"],
)


@router.get(
    "/me",
    response_model=StaffResponse,
)
async def get_my_staff_profile(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await StaffService(db).get_my_profile(
        current_user
    )


@router.get(
    "/me/attendance",
    response_model=list[StaffAttendanceResponse],
)
async def get_my_staff_attendance(
    attendance_date: date | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await StaffAttendanceService(db).get_my_attendance(
        current_user,
        attendance_date,
    )


@router.post(
    "/attendance",
    response_model=StaffAttendanceResponse,
)
async def create_staff_attendance(
    payload: StaffAttendanceCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "SUPER_ADMIN",
            "SCHOOL_ADMIN",
            "STAFF",
        )
    ),
):
    return await StaffAttendanceService(db).create(
        payload,
        current_user,
    )


@router.get(
    "/attendance",
    response_model=list[StaffAttendanceResponse],
)
async def get_staff_attendance(
    staff_id: int | None = None,
    attendance_date: date | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "SUPER_ADMIN",
            "SCHOOL_ADMIN",
        )
    ),
):
    return await StaffAttendanceService(db).get_all(
        current_user,
        staff_id,
        attendance_date,
    )


@router.patch(
    "/attendance/{attendance_id}",
    response_model=StaffAttendanceResponse,
)
async def update_staff_attendance(
    attendance_id: int,
    payload: StaffAttendanceUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "SUPER_ADMIN",
            "SCHOOL_ADMIN",
        )
    ),
):
    return await StaffAttendanceService(db).update(
        attendance_id,
        payload,
        current_user,
    )



@router.post(
    "/me/leave",
    response_model=StaffLeaveResponse,
)
async def create_my_staff_leave(
    payload: StaffLeaveCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await StaffLeaveService(db).create_leave(
        payload,
        current_user,
    )


@router.get(
    "/me/leave",
    response_model=list[StaffLeaveResponse],
)
async def get_my_staff_leave(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await StaffLeaveService(db).get_my_leave(
        current_user,
    )


@router.get(
    "/leave",
    response_model=list[StaffLeaveResponse],
)
async def get_staff_leave(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles("SUPER_ADMIN", "SCHOOL_ADMIN")
    ),
):
    return await StaffLeaveService(db).get_all(
        current_user,
    )


@router.patch(
    "/leave/{leave_id}",
    response_model=StaffLeaveResponse,
)
async def review_staff_leave(
    leave_id: int,
    payload: StaffLeaveReviewRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles("SUPER_ADMIN", "SCHOOL_ADMIN")
    ),
):
    return await StaffLeaveService(db).review(
        leave_id,
        payload,
        current_user,
    )


@router.post(
    "",
    response_model=StaffResponse,
)
async def create_staff(
    payload: StaffCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles("SUPER_ADMIN", "SCHOOL_ADMIN")
    ),
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
    current_user: User = Depends(
        require_roles("SUPER_ADMIN", "SCHOOL_ADMIN")
    ),
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
    current_user: User = Depends(
        require_roles("SUPER_ADMIN", "SCHOOL_ADMIN")
    ),
):
    return await StaffService(db).get_staff_member(
        staff_id,
        current_user,
    )


@router.patch(
    "/{staff_id}",
    response_model=StaffResponse,
)
async def update_staff(
    staff_id: int,
    payload: StaffUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles("SUPER_ADMIN", "SCHOOL_ADMIN")
    ),
):
    return await StaffService(db).update_staff(
        staff_id,
        payload,
        current_user,
    )


@router.patch(
    "/{staff_id}/status",
    response_model=StaffStatusResponse,
)
async def update_staff_status(
    staff_id: int,
    is_active: bool,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles("SUPER_ADMIN", "SCHOOL_ADMIN")
    ),
):
    return await StaffService(db).set_staff_status(
        staff_id,
        is_active,
        current_user,
    )
