from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.youtube_activity import YoutubeActivity
from app.models.youtube_learning import YoutubeLearning
from app.models.user import User
from app.models.student import Student
from app.models.classroom import Classroom


class YoutubeActivityRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(
        self,
        activity: YoutubeActivity,
    ):
        self.db.add(activity)
        await self.db.commit()
        await self.db.refresh(activity)
        return activity

    async def get_activity(
        self,
        school_id: int | None = None,
    ):
        query = (
            select(
                YoutubeActivity.id,
                YoutubeActivity.youtube_learning_id,
                YoutubeLearning.title.label("video_title"),
                YoutubeActivity.user_id.label("student_id"),
                Student.first_name,
                Student.last_name,
                Student.admission_number,
                Classroom.name.label("class_name"),
                User.email,
                YoutubeActivity.activity_type,
                YoutubeActivity.created_at,
            )
            .join(
                YoutubeLearning,
                YoutubeLearning.id == YoutubeActivity.youtube_learning_id,
            )
            .join(
                User,
                User.id == YoutubeActivity.user_id,
            )
            .outerjoin(
                Student,
                Student.user_id == User.id,
            )
            .outerjoin(
                Classroom,
                Classroom.id == Student.classroom_id,
            )
            .order_by(
                YoutubeActivity.created_at.desc()
            )
        )

        if school_id is not None:
            query = query.where(
                YoutubeActivity.school_id == school_id
            )

        result = await self.db.execute(query)

        return result.mappings().all()
