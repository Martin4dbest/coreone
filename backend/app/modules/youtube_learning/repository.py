from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.youtube_learning import YoutubeLearning


class YoutubeLearningRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self):
        result = await self.db.execute(
            select(YoutubeLearning).order_by(
                YoutubeLearning.title
            )
        )
        return result.scalars().all()

    async def get_by_id(
        self,
        video_id: int,
    ):
        result = await self.db.execute(
            select(YoutubeLearning).where(
                YoutubeLearning.id == video_id
            )
        )
        return result.scalar_one_or_none()

    async def create(
        self,
        video: YoutubeLearning,
    ):
        self.db.add(video)
        await self.db.commit()
        await self.db.refresh(video)
        return video
