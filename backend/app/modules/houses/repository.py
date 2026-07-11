from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.house import House


class HouseRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self):
        result = await self.db.execute(
            select(House).order_by(House.name)
        )
        return result.scalars().all()

    async def get_by_id(self, house_id: int):
        result = await self.db.execute(
            select(House).where(
                House.id == house_id
            )
        )
        return result.scalar_one_or_none()

    async def create(self, house: House):
        self.db.add(house)
        await self.db.commit()
        await self.db.refresh(house)
        return house
