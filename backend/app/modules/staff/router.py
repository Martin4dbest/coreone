from datetime import date

from fastapi import APIRouter, Depends, Query, File, Form, UploadFile
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
    StaffAttendanceDeleteResponse,
    StaffClockInRequest,
    StaffClockInResponse,
    StaffClockInStatusResponse,
    StaffAttendanceLocationUpdateRequest,
    StaffAttendanceLocationResponse,
    StaffAttendanceReportItem,
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
)
async def get_my_staff_attendance(
    attendance_date: date | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from sqlalchemy import text

    sql = """
        SELECT
            sa.id,
            sa.staff_id,
            sa.school_id,
            sa.attendance_date,
            sa.status,
            sa.remarks
        FROM staff_attendance sa
        INNER JOIN staff s
            ON s.id = sa.staff_id
        WHERE s.user_id = :user_id
          AND sa.school_id = :school_id
    """

    params = {
        "user_id": current_user.id,
        "school_id": current_user.school_id,
    }

    if attendance_date is not None:
        sql += """
            AND sa.attendance_date = :attendance_date
        """
        params["attendance_date"] = attendance_date

    sql += """
        ORDER BY sa.attendance_date DESC, sa.id DESC
    """

    result = await db.execute(
        text(sql),
        params,
    )

    return [
        {
            "id": row["id"],
            "staff_id": row["staff_id"],
            "school_id": row["school_id"],
            "attendance_date": row["attendance_date"],
            "status": row["status"],
            "remarks": row["remarks"],
        }
        for row in result.mappings().all()
    ]

@router.post(
    "/me/clock-in",
    response_model=StaffClockInResponse,
)
async def clock_in_staff(
    payload: StaffClockInRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await StaffAttendanceService(db).clock_in(
        payload,
        current_user,
    )


@router.get(
    "/me/clock-in-status",
    response_model=StaffClockInStatusResponse,
)
async def get_staff_clock_in_status(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await StaffAttendanceService(
        db
    ).get_clock_in_status(
        current_user,
    )


@router.delete(
    "/attendance/history",
)
async def delete_staff_attendance_history(
    school_id: int,
    start_date: date = Query(...),
    end_date: date = Query(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await StaffAttendanceService(
        db
    ).delete_attendance_history(
        school_id,
        start_date,
        end_date,
        current_user,
    )


@router.get(
    "/attendance/report",
    response_model=list[StaffAttendanceReportItem],
)
async def get_staff_attendance_report(
    school_id: int,
    attendance_date: date | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await StaffAttendanceService(
        db
    ).get_attendance_report(
        school_id,
        current_user,
        attendance_date,
    )


@router.get(
    "/attendance/reverse-geocode",
)
async def reverse_geocode_staff_attendance_location(
    latitude: float,
    longitude: float,
    current_user: User = Depends(
        require_roles(
            "SUPER_ADMIN",
            "SCHOOL_ADMIN",
        )
    ),
):
    from app.modules.staff.attendance_service import _reverse_geocode

    location_name = await _reverse_geocode(
        latitude,
        longitude,
    )

    return {
        "latitude": latitude,
        "longitude": longitude,
        "location_name": location_name,
    }


@router.get(
    "/attendance/location/{school_id}",
    response_model=StaffAttendanceLocationResponse,
)
async def get_staff_attendance_location(
    school_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await StaffAttendanceService(
        db
    ).get_attendance_location(
        school_id,
        current_user,
    )


@router.patch(
    "/attendance/location/{school_id}",
    response_model=StaffAttendanceLocationResponse,
)
async def update_staff_attendance_location(
    school_id: int,
    payload: StaffAttendanceLocationUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await StaffAttendanceService(
        db
    ).update_attendance_location(
        school_id,
        payload,
        current_user,
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
    school_id: int | None = None,
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
        school_id,
    )


@router.delete(
    "/attendance/history",
    response_model=StaffAttendanceDeleteResponse,
)
async def delete_staff_attendance_history(
    school_id: int,
    start_date: date,
    end_date: date,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "SUPER_ADMIN",
            "SCHOOL_ADMIN",
        )
    ),
):
    return await StaffAttendanceService(db).delete_attendance_history(
        school_id,
        start_date,
        end_date,
        current_user,
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
    school_id: int | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles("SUPER_ADMIN", "SCHOOL_ADMIN")
    ),
):
    return await StaffLeaveService(db).get_all(
        current_user,
        school_id,
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
    "/import",
    response_model=list[StaffResponse],
)
async def import_staff(
    file: UploadFile = File(...),
    school_id: int = Form(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles("SUPER_ADMIN", "SCHOOL_ADMIN")
    ),
):
    return await StaffService(db).import_staff(
        school_id,
        file,
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
    school_id: int | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles("SUPER_ADMIN", "SCHOOL_ADMIN")
    ),
):
    return await StaffService(db).get_staff(
        current_user,
        school_id,
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


@router.delete(
    "/{staff_id}",
    status_code=204,
)
async def delete_staff(
    staff_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles("SUPER_ADMIN", "SCHOOL_ADMIN")
    ),
):
    await StaffService(db).delete_staff(
        staff_id,
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
