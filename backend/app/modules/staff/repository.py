from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.staff import Staff


class StaffRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self):
        result = await self.db.execute(
            select(Staff)
        )
        return result.scalars().all()

    async def get_by_id(self, staff_id: int):
        result = await self.db.execute(
            select(Staff).where(
                Staff.id == staff_id
            )
        )
        return result.scalar_one_or_none()

    async def create(self, staff: Staff):
        self.db.add(staff)
        await self.db.commit()
        await self.db.refresh(staff)
        return staff
