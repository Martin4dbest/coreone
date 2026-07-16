from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.level import Level


class LevelRepository:

    def __init__(self, db: AsyncSession):
        self.db = db


    async def get_all(
        self,
        school_id=None,
    ):

        query = select(Level).order_by(Level.id)

        if school_id is not None:
            query = query.where(
                Level.school_id == school_id
            )

        result = await self.db.execute(query)

        return result.scalars().all()



    async def get_by_id(
        self,
        level_id:int,
        school_id=None,
    ):

        query = select(Level).where(
            Level.id == level_id
        )

        if school_id is not None:
            query = query.where(
                Level.school_id == school_id
            )

        result = await self.db.execute(query)

        return result.scalar_one_or_none()



    async def get_by_name(
        self,
        name:str,
        school_id:int,
    ):

        result = await self.db.execute(
            select(Level).where(
                Level.school_id == school_id,
                func.lower(Level.name) == name.lower()
            )
        )

        return result.scalar_one_or_none()



    async def create(
        self,
        level:Level,
    ):

        self.db.add(level)

        await self.db.commit()
        await self.db.refresh(level)

        return level



    async def update(
        self,
        level:Level,
    ):

        await self.db.commit()
        await self.db.refresh(level)

        return level



    async def delete(
        self,
        level:Level,
    ):

        await self.db.delete(level)

        await self.db.commit()
