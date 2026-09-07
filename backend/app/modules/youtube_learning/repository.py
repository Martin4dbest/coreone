from sqlalchemy import and_, exists, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.youtube_learning import YoutubeLearning
from app.models.youtube_learning_student import (
    YoutubeLearningStudent,
)


class YoutubeLearningRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(
        self,
        school_id: int | None = None,
        published_only: bool = False,
    ):
        query = select(YoutubeLearning)

        if school_id is not None:
            query = query.where(
                YoutubeLearning.school_id == school_id
            )

        if published_only:
            query = query.where(
                YoutubeLearning.is_active.is_(True),
                YoutubeLearning.published.is_(True),
            )

        query = query.order_by(
            YoutubeLearning.title
        )

        result = await self.db.execute(query)

        return result.scalars().all()

    async def get_for_student(
        self,
        school_id: int,
        student_id: int,
        classroom_id: int | None,
    ):
        target_exists = exists(
            select(YoutubeLearningStudent.id).where(
                YoutubeLearningStudent.youtube_learning_id
                == YoutubeLearning.id,
                YoutubeLearningStudent.student_id
                == student_id,
            )
        )

        school_wide = and_(
            YoutubeLearning.class_id.is_(None),
            ~exists(
                select(YoutubeLearningStudent.id).where(
                    YoutubeLearningStudent.youtube_learning_id
                    == YoutubeLearning.id,
                )
            ),
        )

        class_match = (
            YoutubeLearning.class_id == classroom_id
            if classroom_id is not None
            else False
        )

        query = (
            select(YoutubeLearning)
            .where(
                YoutubeLearning.school_id == school_id,
                YoutubeLearning.is_active.is_(True),
                YoutubeLearning.published.is_(True),
                or_(
                    school_wide,
                    class_match,
                    target_exists,
                ),
            )
            .order_by(
                YoutubeLearning.title
            )
        )

        result = await self.db.execute(query)

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
        student_ids: list[int] | None = None,
    ):
        self.db.add(video)

        await self.db.flush()

        for student_id in student_ids or []:
            self.db.add(
                YoutubeLearningStudent(
                    youtube_learning_id=video.id,
                    student_id=student_id,
                )
            )

        await self.db.commit()
        await self.db.refresh(video)

        return video
