from datetime import date

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.attendance import Attendance


class AttendanceRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self):
        result = await self.db.execute(
            select(Attendance)
        )
        return result.scalars().all()

    async def get_by_id(self, attendance_id: int):
        result = await self.db.execute(
            select(Attendance).where(
                Attendance.id == attendance_id
            )
        )
        return result.scalar_one_or_none()

    async def get_student_attendance_by_date(
        self,
        student_id: int,
        attendance_date: date,
    ):
        result = await self.db.execute(
            select(Attendance).where(
                Attendance.student_id == student_id,
                Attendance.attendance_date == attendance_date,
            )
        )
        return result.scalar_one_or_none()

    async def create(self, attendance: Attendance):
        self.db.add(attendance)
        await self.db.commit()
        await self.db.refresh(attendance)
        return attendance
