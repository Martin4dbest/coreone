from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.subject import Subject


class SubjectRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(
        self,
        school_id: int | None = None,
    ):
        query = select(Subject).order_by(Subject.name)

        if school_id is not None:
            query = query.where(
                Subject.school_id == school_id
            )

        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_by_id(self, subject_id: int):
        result = await self.db.execute(
            select(Subject).where(
                Subject.id == subject_id
            )
        )
        return result.scalar_one_or_none()

    async def create(self, subject: Subject):
        self.db.add(subject)
        await self.db.commit()
        await self.db.refresh(subject)
        return subject
