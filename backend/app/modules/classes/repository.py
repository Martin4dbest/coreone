from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.classroom import Classroom


class ClassRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self):
        result = await self.db.execute(
            select(Classroom)
        )
        return result.scalars().all()

    async def get_by_id(self, class_id: int):
        result = await self.db.execute(
            select(Classroom).where(
                Classroom.id == class_id
            )
        )
        return result.scalar_one_or_none()

    async def create(self, classroom: Classroom):
        self.db.add(classroom)
        await self.db.commit()
        await self.db.refresh(classroom)
        return classroom
