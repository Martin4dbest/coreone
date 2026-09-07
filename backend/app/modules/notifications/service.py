from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification
from app.models.parent import Parent
from app.models.parent_student import ParentStudent
from app.models.student import Student
from app.models.user import User
from app.modules.notifications.repository import NotificationRepository
from app.modules.notifications.schemas import NotificationCreateRequest


class NotificationService:

    def __init__(self, db: AsyncSession):
        self.db = db
        self.repository = NotificationRepository(db)

    async def _get_current_student(self, current_user):
        result = await self.db.execute(
            select(Student).where(
                Student.user_id == current_user.id,
                Student.school_id == current_user.school_id,
                Student.is_active.is_(True),
            )
        )
        return result.scalar_one_or_none()

    async def _get_current_parent(self, current_user):
        result = await self.db.execute(
            select(Parent)
            .join(User, Parent.user_id == User.id)
            .where(
                Parent.user_id == current_user.id,
                User.school_id == current_user.school_id,
            )
        )
        return result.scalar_one_or_none()

    async def _get_current_parent_student_ids(self, current_user):
        parent = await self._get_current_parent()

        if not parent:
            return []

        result = await self.db.execute(
            select(ParentStudent.student_id)
            .join(
                Student,
                ParentStudent.student_id == Student.id,
            )
            .where(
                ParentStudent.parent_id == parent.id,
                Student.school_id == current_user.school_id,
                Student.is_active.is_(True),
            )
        )

        return list(result.scalars().all())

    async def _validate_student_target(
        self,
        school_id: int,
        student_id: int,
    ):
        result = await self.db.execute(
            select(Student).where(
                Student.id == student_id,
                Student.school_id == school_id,
                Student.is_active.is_(True),
            )
        )
        return result.scalar_one_or_none()

    async def create_notification(
        self,
        payload: NotificationCreateRequest,
        current_user,
    ):
        role = (
            getattr(current_user.role, "name", "")
            or ""
        ).upper()

        if role == "SUPER_ADMIN":
            school_id = payload.school_id
        else:
            if current_user.school_id != payload.school_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You do not have access to this school.",
                )

            school_id = current_user.school_id

        recipient_type = payload.recipient_type

        if recipient_type is not None:
            recipient_type = recipient_type.strip()

            if recipient_type.startswith("STUDENT:"):
                student_id_text = recipient_type.split(":", 1)[1].strip()

                if not student_id_text.isdigit():
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Invalid student notification target.",
                    )

                student_id = int(student_id_text)

                student = await self._validate_student_target(
                    school_id,
                    student_id,
                )

                if not student:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="Student not found in this school.",
                    )

            elif recipient_type not in {
                "STUDENT",
                "PARENT",
                "TEACHER",
            }:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid notification recipient type.",
                )

        notification = Notification(
            school_id=school_id,
            title=payload.title,
            message=payload.message,
            recipient_type=recipient_type,
            is_active=True,
            is_read=False,
        )

        return await self.repository.create(notification)

    async def get_notifications(self, current_user):
        role = (
            getattr(current_user.role, "name", "")
            or ""
        ).upper()

        school_id = current_user.school_id

        if not school_id:
            return []

        if role == "STUDENT":
            student = await self._get_current_student(current_user)

            if not student:
                return []

            return await self.repository.get_all(
                school_id=school_id,
                recipient_type="STUDENT",
                student_id=student.id,
            )

        if role == "PARENT":
            student_ids = await self._get_current_parent_student_ids(
                current_user
            )

            return await self.repository.get_all(
                school_id=school_id,
                recipient_type="PARENT",
                student_ids=student_ids,
            )

        if role == "TEACHER":
            return await self.repository.get_all(
                school_id=school_id,
                recipient_type="TEACHER",
            )

        return await self.repository.get_all(
            school_id=school_id,
        )

    async def clear_all_notifications(self, current_user):
        role = (
            getattr(current_user.role, "name", "")
            or ""
        ).upper()

        school_id = current_user.school_id

        if not school_id:
            return {"cleared": 0}

        if role == "STUDENT":
            student = await self._get_current_student(current_user)

            if not student:
                return {"cleared": 0}

            cleared = await self.repository.clear_all(
                school_id=school_id,
                recipient_type="STUDENT",
                student_id=student.id,
            )

            return {"cleared": cleared}

        if role == "PARENT":
            student_ids = await self._get_current_parent_student_ids(
                current_user
            )

            cleared = await self.repository.clear_all(
                school_id=school_id,
                recipient_type="PARENT",
                student_ids=student_ids,
            )

            return {"cleared": cleared}

        if role == "TEACHER":
            cleared = await self.repository.clear_all(
                school_id=school_id,
                recipient_type="TEACHER",
            )

            return {"cleared": cleared}

        cleared = await self.repository.clear_all(
            school_id=school_id,
        )

        return {"cleared": cleared}

    async def get_notification(
        self,
        notification_id: int,
        current_user,
    ):
        notification = await self.repository.get_by_id(
            notification_id,
            current_user.school_id,
        )

        if not notification:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification not found",
            )

        role = (
            getattr(current_user.role, "name", "")
            or ""
        ).upper()

        recipient = notification.recipient_type

        if role == "STUDENT":
            student = await self._get_current_student(current_user)

            if not student:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Notification not found",
                )

            allowed = {
                None,
                "STUDENT",
                f"STUDENT:{student.id}",
            }

            if recipient not in allowed:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Notification not found",
                )

        elif role == "PARENT":
            student_ids = await self._get_current_parent_student_ids(
                current_user
            )

            allowed = {
                None,
                "PARENT",
            }

            allowed.update(
                f"STUDENT:{student_id}"
                for student_id in student_ids
            )

            if recipient not in allowed:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Notification not found",
                )

        elif role == "TEACHER":
            if recipient not in {
                None,
                "TEACHER",
            }:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Notification not found",
                )

        return notification

    async def mark_notification_as_read(
        self,
        notification_id: int,
        current_user,
    ):
        await self.get_notification(
            notification_id,
            current_user,
        )

        notification = await self.repository.mark_as_read(
            notification_id,
            current_user.school_id,
        )

        if not notification:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification not found",
            )

        return notification
