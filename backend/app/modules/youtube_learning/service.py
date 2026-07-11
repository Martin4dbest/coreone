from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.youtube_learning import YoutubeLearning
from app.modules.youtube_learning.repository import YoutubeLearningRepository
from app.modules.youtube_learning.schemas import YoutubeLearningCreateRequest


class YoutubeLearningService:

    def __init__(self, db: AsyncSession):
        self.repository = YoutubeLearningRepository(db)

    async def create_video(
        self,
        payload: YoutubeLearningCreateRequest,
    ):
        video = YoutubeLearning(
            school_id=payload.school_id,
            title=payload.title,
            video_url=payload.video_url,
            description=payload.description,
            subject=payload.subject,
            class_id=payload.class_id,
            uploaded_by=payload.uploaded_by,
            is_active=True,
        )

        return await self.repository.create(video)

    async def get_videos(self):
        return await self.repository.get_all()

    async def get_video(
        self,
        video_id: int,
    ):
        video = await self.repository.get_by_id(
            video_id
        )

        if not video:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Learning video not found",
            )

        return video
