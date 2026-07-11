from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.assessment import Assessment


class AssessmentRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self):
        result = await self.db.execute(
            select(Assessment).order_by(
                Assessment.created_at.desc()
            )
        )
        return result.scalars().all()

    async def get_by_id(self, assessment_id: int):
        result = await self.db.execute(
            select(Assessment).where(
                Assessment.id == assessment_id
            )
        )
        return result.scalar_one_or_none()

    async def create(
        self,
        assessment: Assessment,
    ):
        self.db.add(assessment)
        await self.db.commit()
        await self.db.refresh(assessment)
        return assessment
