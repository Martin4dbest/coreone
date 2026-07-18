from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.classroom import Classroom


class ClassRepository:

    def __init__(self, db: AsyncSession):
        self.db = db


    async def get_all(
        self,
        school_id: int | None = None,
    ):
        query = select(Classroom)

        if school_id is not None:
            query = query.where(
                Classroom.school_id == school_id
            )

        result = await self.db.execute(query)

        return result.scalars().all()


    async def get_by_id(
        self,
        class_id: int,
        school_id: int | None = None,
    ):
        query = select(Classroom).where(
            Classroom.id == class_id
        )

        if school_id is not None:
            query = query.where(
                Classroom.school_id == school_id
            )

        result = await self.db.execute(query)

        return result.scalar_one_or_none()


    async def create(
        self,
        classroom: Classroom,
    ):
        self.db.add(classroom)

        await self.db.commit()
        await self.db.refresh(classroom)

        return classroom

    async def update(self, classroom: Classroom):
        await self.db.commit()
        await self.db.refresh(classroom)
        return classroom



    async def delete(
        self,
        classroom: Classroom,
    ):
        await self.db.delete(classroom)
        await self.db.commit()
