from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.attendance import Attendance
from app.modules.attendance.repository import AttendanceRepository
from app.modules.attendance.schemas import AttendanceCreateRequest


class AttendanceService:

    def __init__(self, db: AsyncSession):
        self.repository = AttendanceRepository(db)

    async def create_attendance(
        self,
        payload: AttendanceCreateRequest,
    ):
        existing = (
            await self.repository.get_student_attendance_by_date(
                payload.student_id,
                payload.attendance_date,
            )
        )

        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Attendance already recorded for this student on this date",
            )

        allowed_statuses = {
            "present",
            "absent",
            "late",
            "excused",
        }

        if payload.status.lower() not in allowed_statuses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Status must be present, absent, late, or excused",
            )

        attendance = Attendance(
            school_id=payload.school_id,
            student_id=payload.student_id,
            classroom_id=payload.classroom_id,
            attendance_date=payload.attendance_date,
            status=payload.status.lower(),
            remarks=payload.remarks,
        )

        return await self.repository.create(attendance)

    async def get_attendance(self):
        return await self.repository.get_all()

    async def get_attendance_by_id(
        self,
        attendance_id: int,
    ):
        attendance = await self.repository.get_by_id(
            attendance_id
        )

        if not attendance:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Attendance record not found",
            )

        return attendance
