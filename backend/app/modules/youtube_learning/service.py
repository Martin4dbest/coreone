from fastapi import HTTPException, status
from sqlalchemy import select

from app.models.student import Student
from app.models.youtube_activity import YoutubeActivity
from app.models.youtube_learning import YoutubeLearning
from app.modules.youtube_learning.activity_repository import (
    YoutubeActivityRepository,
)
from app.modules.youtube_learning.repository import (
    YoutubeLearningRepository,
)
from app.modules.youtube_learning.schemas import (
    YoutubeLearningCreateRequest,
)


class YoutubeLearningService:

    def __init__(self, db):
        self.db = db
        self.repository = YoutubeLearningRepository(db)
        self.activity_repository = YoutubeActivityRepository(db)

    async def create_video(
        self,
        payload: YoutubeLearningCreateRequest,
        current_user,
    ):
        school_id = getattr(
            current_user,
            "school_id",
            None,
        )

        if not school_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "A school must be selected before "
                    "adding YouTube content."
                ),
            )

        class_id = payload.class_id

        student_ids = list(
            dict.fromkeys(payload.student_ids)
        )

        # A video must use either class targeting,
        # specific-student targeting, or school-wide targeting.
        if class_id is not None and student_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Choose either a class or specific students, "
                    "not both."
                ),
            )

        if class_id is not None:
            class_check = await self.db.execute(
                select(
                    Student.classroom_id
                ).where(
                    Student.school_id == school_id,
                    Student.classroom_id == class_id,
                    Student.is_active.is_(True),
                ).limit(1)
            )

            if class_check.scalar_one_or_none() is None:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Class not found in this school.",
                )

        if student_ids:
            result = await self.db.execute(
                select(Student.id).where(
                    Student.id.in_(student_ids),
                    Student.school_id == school_id,
                    Student.is_active.is_(True),
                )
            )

            valid_student_ids = set(
                result.scalars().all()
            )

            missing = [
                student_id
                for student_id in student_ids
                if student_id not in valid_student_ids
            ]

            if missing:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=(
                        "One or more selected students "
                        "do not belong to this school."
                    ),
                )

        video = YoutubeLearning(
            school_id=school_id,
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
            class_id=class_id,
            uploaded_by=current_user.id,
            created_by=current_user.id,
            published=payload.published,
            is_active=payload.is_active,
        )

        return await self.repository.create(
            video,
            student_ids=student_ids,
        )

    async def get_videos(
        self,
        current_user,
    ):
        role = (
            getattr(
                current_user.role,
                "name",
                "",
            )
            or ""
        ).upper()

        school_id = getattr(
            current_user,
            "school_id",
            None,
        )

        if not school_id:
            return []

        # Student sees only videos explicitly available
        # to that student.
        if role == "STUDENT":
            result = await self.db.execute(
                select(Student).where(
                    Student.user_id == current_user.id,
                    Student.school_id == school_id,
                    Student.is_active.is_(True),
                )
            )

            student = (
                result.scalar_one_or_none()
            )

            if not student:
                return []

            return await self.repository.get_for_student(
                school_id=school_id,
                student_id=student.id,
                classroom_id=student.classroom_id,
            )

        # Admin/school management view:
        # always stay inside the selected school.
        return await self.repository.get_all(
            school_id=school_id,
        )

    async def get_video(
        self,
        video_id: int,
        current_user,
    ):
        video = await self.repository.get_by_id(
            video_id
        )

        if not video:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Learning video not found",
            )

        if video.school_id != current_user.school_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Learning video not found",
            )

        role = (
            getattr(
                current_user.role,
                "name",
                "",
            )
            or ""
        ).upper()

        if role == "STUDENT":
            result = await self.db.execute(
                select(Student).where(
                    Student.user_id == current_user.id,
                    Student.school_id
                    == current_user.school_id,
                    Student.is_active.is_(True),
                )
            )

            student = (
                result.scalar_one_or_none()
            )

            if not student:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Learning video not found",
                )

            videos = await self.repository.get_for_student(
                school_id=current_user.school_id,
                student_id=student.id,
                classroom_id=student.classroom_id,
            )

            if not any(
                item.id == video.id
                for item in videos
            ):
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
        video = await self.repository.get_by_id(
            video_id
        )

        if not video:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Learning video not found",
            )

        if video.school_id != current_user.school_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Learning video not found",
            )

        # Students may only record activity on videos
        # they are actually allowed to see.
        role = (
            getattr(
                current_user.role,
                "name",
                "",
            )
            or ""
        ).upper()

        if role == "STUDENT":
            result = await self.db.execute(
                select(Student).where(
                    Student.user_id == current_user.id,
                    Student.school_id
                    == current_user.school_id,
                    Student.is_active.is_(True),
                )
            )

            student = (
                result.scalar_one_or_none()
            )

            if not student:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Learning video not found",
                )

            allowed = await self.repository.get_for_student(
                school_id=current_user.school_id,
                student_id=student.id,
                classroom_id=student.classroom_id,
            )

            if not any(
                item.id == video.id
                for item in allowed
            ):
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

        return await self.activity_repository.create(
            activity
        )
