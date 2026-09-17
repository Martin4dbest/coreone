from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.staff import Staff
from app.models.user import User


class StaffRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(
        self,
        school_id: int | None = None,
    ):
        query = (
            select(Staff)
            .join(Staff.user)
            .options(selectinload(Staff.user))
        )

        if school_id is not None:
            query = query.where(
                User.school_id == school_id
            )

        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_by_id(
        self,
        staff_id: int,
        school_id: int | None = None,
    ):
        query = (
            select(Staff)
            .join(Staff.user)
            .options(selectinload(Staff.user))
            .where(Staff.id == staff_id)
        )

        if school_id is not None:
            query = query.where(
                User.school_id == school_id
            )

        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_by_user_id(
        self,
        user_id: int,
    ):
        query = (
            select(Staff)
            .join(Staff.user)
            .options(selectinload(Staff.user))
            .where(User.id == user_id)
        )

        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_by_employee_number(
        self,
        employee_number: str,
    ):
        result = await self.db.execute(
            select(Staff).where(
                Staff.employee_number == employee_number
            )
        )

        return result.scalar_one_or_none()

    async def create(self, staff: Staff):
        self.db.add(staff)
        await self.db.commit()
        await self.db.refresh(staff)

        result = await self.db.execute(
            select(Staff)
            .options(selectinload(Staff.user))
            .where(Staff.id == staff.id)
        )
        return result.scalar_one()
