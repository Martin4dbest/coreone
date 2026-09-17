from datetime import date

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.staff_attendance import StaffAttendance


class StaffAttendanceRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(
        self,
        attendance_id: int,
        school_id: int,
    ):
        result = await self.db.execute(
            select(StaffAttendance).where(
                StaffAttendance.id == attendance_id,
                StaffAttendance.school_id == school_id,
            )
        )

        return result.scalar_one_or_none()

    async def get_by_staff_date(
        self,
        staff_id: int,
        attendance_date: date,
    ):
        result = await self.db.execute(
            select(StaffAttendance).where(
                StaffAttendance.staff_id == staff_id,
                StaffAttendance.attendance_date == attendance_date,
            )
        )

        return result.scalar_one_or_none()

    async def get_all(
        self,
        school_id: int,
        staff_id: int | None = None,
        attendance_date: date | None = None,
    ):
        query = select(StaffAttendance).where(
            StaffAttendance.school_id == school_id
        )

        if staff_id is not None:
            query = query.where(
                StaffAttendance.staff_id == staff_id
            )

        if attendance_date is not None:
            query = query.where(
                StaffAttendance.attendance_date == attendance_date
            )

        query = query.order_by(
            StaffAttendance.attendance_date.desc(),
            StaffAttendance.id.desc(),
        )

        result = await self.db.execute(query)

        return result.scalars().all()

    async def create(
        self,
        attendance: StaffAttendance,
    ):
        self.db.add(attendance)

        await self.db.commit()

        await self.db.refresh(attendance)

        return attendance
