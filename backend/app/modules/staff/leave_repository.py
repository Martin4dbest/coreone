from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.staff_leave import StaffLeave


class StaffLeaveRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(
        self,
        leave_id: int,
        school_id: int | None = None,
    ):
        query = select(StaffLeave).where(
            StaffLeave.id == leave_id
        )

        if school_id is not None:
            query = query.where(
                StaffLeave.school_id == school_id
            )

        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_all(
        self,
        school_id: int | None = None,
        staff_id: int | None = None,
    ):
        query = select(StaffLeave).order_by(
            StaffLeave.start_date.desc()
        )

        if school_id is not None:
            query = query.where(
                StaffLeave.school_id == school_id
            )

        if staff_id is not None:
            query = query.where(
                StaffLeave.staff_id == staff_id
            )

        result = await self.db.execute(query)
        return result.scalars().all()

    async def create(self, leave: StaffLeave):
        self.db.add(leave)
        await self.db.commit()
        await self.db.refresh(leave)
        return leave
