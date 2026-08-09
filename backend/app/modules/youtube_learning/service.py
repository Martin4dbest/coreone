from fastapi import HTTPException, status

from app.models.youtube_learning import YoutubeLearning
from app.modules.youtube_learning.repository import YoutubeLearningRepository
from app.modules.youtube_learning.schemas import YoutubeLearningCreateRequest


class YoutubeLearningService:

    def __init__(self, db):
        self.db = db
        self.repository = YoutubeLearningRepository(db)

    async def create_video(
        self,
        payload: YoutubeLearningCreateRequest,
        current_user,
    ):
        if not current_user.school_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The current user is not associated with a school.",
            )

        video = YoutubeLearning(
            school_id=current_user.school_id,
            title=payload.title.strip(),
            video_url=payload.video_url.strip(),
            youtube_url=payload.video_url.strip(),
            description=(
                payload.description.strip()
                if payload.description
                else None
            ),
            subject=(
                payload.subject.strip()
                if payload.subject
                else None
            ),
            class_id=payload.class_id,
            uploaded_by=current_user.id,
            created_by=current_user.id,
            is_active=payload.is_active,
            published=payload.published,
        )

        return await self.repository.create(video)

    async def get_videos(self, current_user):

        # Super admin can see all schools.
        if current_user.role.name == "SUPER_ADMIN":
            return await self.repository.get_all()

        # Everyone else is restricted to their school.
        if not current_user.school_id:
            return []

        # Students should only receive videos that are
        # active and published.
        if current_user.role.name == "STUDENT":
            return await self.repository.get_all(
                school_id=current_user.school_id,
                published_only=True,
            )

        return await self.repository.get_all(
            school_id=current_user.school_id,
        )

    async def get_video(
        self,
        video_id: int,
        current_user,
    ):
        video = await self.repository.get_by_id(video_id)

        if not video:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Learning video not found",
            )

        # Super admin may access any school.
        if current_user.role.name != "SUPER_ADMIN":

            if video.school_id != current_user.school_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You do not have access to this learning video.",
                )

            # Students cannot open unpublished/inactive videos.
            if current_user.role.name == "STUDENT":
                if not video.is_active or not video.published:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="Learning video not found",
                    )

        return video

    async def record_activity(
        self,
        video_id: int,
        current_user,
    ):
        # Reuse access validation so a student cannot
        # record activity against another school's video.
        await self.get_video(
            video_id,
            current_user,
        )

        return {
            "success": True,
            "video_id": video_id,
        }
