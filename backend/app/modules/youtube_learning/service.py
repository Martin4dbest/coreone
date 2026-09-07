from app.models.youtube_learning import YoutubeLearning
from app.modules.youtube_learning.repository import YoutubeLearningRepository
from app.modules.youtube_learning.schemas import YoutubeLearningCreateRequest


class YoutubeLearningService:

    def __init__(self, db):
        self.repository = YoutubeLearningRepository(db)

    async def create_video(
        self,
        payload: YoutubeLearningCreateRequest,
        current_user,
    ):
        if not current_user.school_id:
            raise ValueError(
                "A school must be selected before adding YouTube content."
            )

        video = YoutubeLearning(
            school_id=current_user.school_id,
            title=payload.title.strip(),
            description=(
                payload.description.strip()
                if payload.description
                else None
            ),
            youtube_url=payload.video_url.strip(),
            published=True,
            is_active=True,
        )

        return await self.repository.create(video)

    async def get_videos(self, current_user):
        school_id = getattr(current_user, "school_id", None)

        if not school_id:
            return []

        # IMPORTANT:
        # Even SUPER_ADMIN must only see videos belonging to
        # the school currently being viewed.
        return await self.repository.get_all(
            school_id=school_id,
        )

    async def get_video(
        self,
        video_id: int,
        current_user,
    ):
        video = await self.repository.get_by_id(video_id)

        if not video:
            return None

        # Tenant isolation applies to every role, including SUPER_ADMIN.
        if video.school_id != current_user.school_id:
            return None

        return video
