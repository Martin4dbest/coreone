from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.subject import Subject


class SubjectRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self):
        result = await self.db.execute(
            select(Subject).order_by(Subject.name)
        )
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
