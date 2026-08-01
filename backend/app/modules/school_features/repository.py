from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.school_feature import SchoolFeature


class SchoolFeatureRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(
        self,
        feature: SchoolFeature,
    ):
        self.db.add(feature)

    async def get_all(
        self,
        school_id: int,
    ):
        result = await self.db.execute(
            select(SchoolFeature)
            .where(
                SchoolFeature.school_id == school_id
            )
            .order_by(
                SchoolFeature.feature_key
            )
        )

        return result.scalars().all()

    async def get(
        self,
        school_id: int,
        feature_key: str,
    ):
        result = await self.db.execute(
            select(SchoolFeature).where(
                SchoolFeature.school_id == school_id,
                SchoolFeature.feature_key == feature_key,
            )
        )

        return result.scalar_one_or_none()

    async def commit(self):
        await self.db.commit()
