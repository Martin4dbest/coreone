from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.house import House
from app.modules.houses.repository import HouseRepository
from app.modules.houses.schemas import HouseCreateRequest


class HouseService:

    def __init__(self, db: AsyncSession):
        self.repository = HouseRepository(db)

    async def create_house(
        self,
        payload: HouseCreateRequest,
    ):
        house = House(
            school_id=payload.school_id,
            name=payload.name,
            color=payload.color,
            is_active=True,
        )

        return await self.repository.create(house)

    async def get_houses(self):
        return await self.repository.get_all()

    async def get_house(self, house_id: int):
        house = await self.repository.get_by_id(house_id)

        if not house:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="House not found",
            )

        return house