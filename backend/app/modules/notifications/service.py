from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification
from app.models.school_feature import SchoolFeature
from app.models.student import Student
from app.modules.notifications.repository import NotificationRepository
from app.modules.notifications.schemas import NotificationCreateRequest


class NotificationService:

    def __init__(self, db: AsyncSession):
        self.db = db
        self.repository = NotificationRepository(db)

    async def _ensure_enabled(
        self,
        school_id: int | None,
    ):
        """
        Notifications is a tenant-level paid feature.

        A school can only use Notifications when its
        notifications feature is enabled.
        """
        if not school_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Notifications feature is not available for this school.",
            )

        result = await self.db.execute(
            select(SchoolFeature).where(
                SchoolFeature.school_id == school_id,
                SchoolFeature.feature_key == "notifications",
            )
        )

        feature = result.scalar_one_or_none()

        if not feature or not feature.enabled:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Notifications feature is disabled for this school.",
            )

    async def _get_current_student(self, current_user):
        result = await self.db.execute(
            select(Student).where(
                Student.user_id == current_user.id,
                Student.school_id == current_user.school_id,
                Student.is_active.is_(True),
            )
        )
        return result.scalar_one_or_none()

    async def create_notification(
        self,
        payload: NotificationCreateRequest,
        current_user,
    ):
        role = current_user.role.name

        if role == "SUPER_ADMIN":
            school_id = payload.school_id
        else:
            if current_user.school_id != payload.school_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You do not have access to this school.",
                )

            school_id = current_user.school_id

        # PAID FEATURE ENFORCEMENT
        await self._ensure_enabled(school_id)

        notification = Notification(
            school_id=school_id,
            title=payload.title.strip(),
            message=payload.message.strip(),
            recipient_type=payload.recipient_type,
            is_active=True,
        )

        return await self.repository.create(notification)

    async def get_notifications(self, current_user):
        # PAID FEATURE ENFORCEMENT
        await self._ensure_enabled(
            current_user.school_id
        )

        role = current_user.role.name

        if role == "STUDENT":
            student = await self._get_current_student(current_user)

            if not student:
                return []

            return await self.repository.get_all(
                school_id=current_user.school_id,
                recipient_type="STUDENT",
                student_id=student.id,
            )

        recipient_type = None

        if role == "TEACHER":
            recipient_type = "TEACHER"
        elif role == "PARENT":
            recipient_type = "PARENT"

        return await self.repository.get_all(
            school_id=current_user.school_id,
            recipient_type=recipient_type,
        )

    async def clear_all_notifications(
        self,
        current_user,
    ):
        # PAID FEATURE ENFORCEMENT
        await self._ensure_enabled(
            current_user.school_id
        )

        role = current_user.role.name

        # Admins clear the school's entire active notification history.
        if role in ("SUPER_ADMIN", "SCHOOL_ADMIN"):
            cleared = await self.repository.clear_all(
                school_id=current_user.school_id,
            )
            return {"cleared": cleared}

        # Other users clear only notifications applicable to themselves.
        if role == "STUDENT":
            student = await self._get_current_student(current_user)

            if not student:
                return {"cleared": 0}

            cleared = await self.repository.clear_all(
                school_id=current_user.school_id,
                recipient_type="STUDENT",
                student_id=student.id,
            )
        else:
            recipient_type = None

            if role == "TEACHER":
                recipient_type = "TEACHER"
            elif role == "PARENT":
                recipient_type = "PARENT"

            cleared = await self.repository.clear_all(
                school_id=current_user.school_id,
                recipient_type=recipient_type,
            )

        return {"cleared": cleared}

    async def get_notification(
        self,
        notification_id: int,
        current_user,
    ):
        # PAID FEATURE ENFORCEMENT
        await self._ensure_enabled(
            current_user.school_id
        )

        notification = await self.repository.get_by_id(
            notification_id,
            current_user.school_id,
        )

        if not notification:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification not found",
            )

        if current_user.role.name == "STUDENT":
            student = await self._get_current_student(current_user)

            if not student:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Student profile not found",
                )

            if (
                notification.recipient_type is not None
                and notification.recipient_type
                != f"STUDENT:{student.id}"
            ):
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
        # PAID FEATURE ENFORCEMENT
        await self._ensure_enabled(
            current_user.school_id
        )

        notification = await self.repository.get_by_id(
            notification_id,
            current_user.school_id,
        )

        if not notification or not notification.is_active:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification not found",
            )

        if current_user.role.name == "STUDENT":
            student = await self._get_current_student(current_user)

            if not student:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Student profile not found",
                )

            if (
                notification.recipient_type is not None
                and notification.recipient_type
                != f"STUDENT:{student.id}"
            ):
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Notification not found",
                )

        return await self.repository.mark_as_read(
            notification_id,
            current_user.school_id,
        )
