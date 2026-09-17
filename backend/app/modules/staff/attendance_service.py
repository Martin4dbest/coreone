from datetime import date

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.staff import Staff
from app.models.staff_attendance import StaffAttendance

from app.modules.staff.attendance_repository import (
    StaffAttendanceRepository,
)
from app.modules.staff.attendance_schemas import (
    StaffAttendanceCreateRequest,
    StaffAttendanceUpdateRequest,
)


ALLOWED_STATUSES = {
    "present",
    "absent",
    "late",
    "excused",
}


class StaffAttendanceService:

    def __init__(self, db: AsyncSession):
        self.db = db
        self.repository = StaffAttendanceRepository(db)

    async def _school_id(self, current_user):
        if current_user.role.name == "SUPER_ADMIN":
            return current_user.school_id

        if current_user.school_id is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User is not linked to a school.",
            )

        return current_user.school_id

    async def _get_staff(
        self,
        staff_id: int,
        school_id: int,
    ):
        result = await self.db.execute(
            select(Staff)
            .join(Staff.user)
            .where(
                Staff.id == staff_id,
            )
        )

        staff = result.scalar_one_or_none()

        if not staff or staff.user.school_id != school_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Staff member not found.",
            )

        return staff

    async def create(
        self,
        payload: StaffAttendanceCreateRequest,
        current_user,
    ):
        school_id = await self._school_id(current_user)

        if current_user.role.name == "STAFF":
            if (
                not current_user.staff
                or current_user.staff.id != payload.staff_id
            ):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You can only record your own attendance.",
                )

        elif current_user.role.name not in {
            "SUPER_ADMIN",
            "SCHOOL_ADMIN",
        }:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not permitted to manage staff attendance.",
            )

        await self._get_staff(
            payload.staff_id,
            school_id,
        )

        attendance_status = payload.status.lower().strip()

        if attendance_status not in ALLOWED_STATUSES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Status must be present, absent, late, or excused.",
            )

        existing = await self.repository.get_by_staff_date(
            payload.staff_id,
            payload.attendance_date,
        )

        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Staff attendance already exists for this date.",
            )

        attendance = StaffAttendance(
            staff_id=payload.staff_id,
            school_id=school_id,
            attendance_date=payload.attendance_date,
            status=attendance_status,
            remarks=payload.remarks,
        )

        return await self.repository.create(attendance)

    async def get_my_attendance(
        self,
        current_user,
        attendance_date: date | None = None,
    ):
        if current_user.role.name != "STAFF":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Staff access required.",
            )

        if not current_user.staff:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Staff profile not found.",
            )

        return await self.repository.get_all(
            school_id=current_user.school_id,
            staff_id=current_user.staff.id,
            attendance_date=attendance_date,
        )

    async def get_all(
        self,
        current_user,
        staff_id: int | None = None,
        attendance_date: date | None = None,
    ):
        if current_user.role.name not in {
            "SUPER_ADMIN",
            "SCHOOL_ADMIN",
        }:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not permitted to view staff attendance.",
            )

        return await self.repository.get_all(
            school_id=current_user.school_id,
            staff_id=staff_id,
            attendance_date=attendance_date,
        )

    async def update(
        self,
        attendance_id: int,
        payload: StaffAttendanceUpdateRequest,
        current_user,
    ):
        if current_user.role.name not in {
            "SUPER_ADMIN",
            "SCHOOL_ADMIN",
        }:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not permitted to update staff attendance.",
            )

        school_id = await self._school_id(current_user)

        attendance = await self.repository.get_by_id(
            attendance_id,
            school_id,
        )

        if not attendance:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Staff attendance record not found.",
            )

        attendance_status = payload.status.lower().strip()

        if attendance_status not in ALLOWED_STATUSES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Status must be present, absent, late, or excused.",
            )

        attendance.status = attendance_status
        attendance.remarks = payload.remarks

        await self.db.commit()
        await self.db.refresh(attendance)

        return attendance
