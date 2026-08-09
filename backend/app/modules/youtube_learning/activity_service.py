from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.youtube_activity import YoutubeActivity
from app.models.youtube_learning import YoutubeLearning
from app.modules.youtube_learning.activity_repository import (
    YoutubeActivityRepository,
)


class YoutubeActivityService:

    def __init__(self, db: AsyncSession):
        self.db = db
        self.repository = YoutubeActivityRepository(db)

    async def record_activity(
        self,
        video_id: int,
        current_user,
    ):
        video = await self.db.get(
            YoutubeLearning,
            video_id,
        )

        if not video:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Learning video not found",
            )

        if current_user.role.name != "SUPER_ADMIN":
            if video.school_id != current_user.school_id:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Learning video not found",
                )

        activity = YoutubeActivity(
            youtube_learning_id=video.id,
            user_id=current_user.id,
            school_id=video.school_id,
            activity_type="open",
        )

        return await self.repository.create(activity)

    async def get_activity(
        self,
        current_user,
    ):
        if current_user.role.name == "SUPER_ADMIN":
            return await self.repository.get_activity()

        return await self.repository.get_activity(
            current_user.school_id
        )
