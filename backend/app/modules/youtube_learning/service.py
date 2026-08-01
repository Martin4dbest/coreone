from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.youtube_learning import YoutubeLearning
from app.modules.youtube_learning.repository import YoutubeLearningRepository
from app.modules.school_features.repository import SchoolFeatureRepository
from app.modules.youtube_learning.schemas import YoutubeLearningCreateRequest


class YoutubeLearningService:


    async def _ensure_enabled(
        self,
        school_id: int,
    ):

        feature = await SchoolFeatureRepository(
            self.repository.db
        ).get_feature(
            school_id,
            "youtube_learning",
        )


        if feature and not feature.enabled:

            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="YouTube Learning has been disabled for this school.",
            )



    def __init__(
        self,
        db: AsyncSession
    ):

        self.repository = YoutubeLearningRepository(db)



    async def create_video(
        self,
        payload: YoutubeLearningCreateRequest,
        current_user,
    ):

        await self._ensure_enabled(
            payload.school_id
        )


        video = YoutubeLearning(
            school_id=current_user.school_id,
            title=payload.title,
            video_url=payload.video_url,
            description=payload.description,
            subject=payload.subject,
            class_id=payload.class_id,
            uploaded_by=current_user.id,
            is_active=True,
        )


        return await self.repository.create(
            video
        )



    async def get_videos(
        self,
        current_user,
    ):


        if current_user.role.name == "SUPER_ADMIN":

            return await self.repository.get_all()



        return await self.repository.get_all(
            current_user.school_id
        )



    async def get_video(
        self,
        video_id:int,
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
