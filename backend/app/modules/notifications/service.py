from fastapi import HTTPException, status
from sqlalchemy import select

from app.models.student import Student
from app.models.parent import Parent
from app.modules.notifications.repository import NotificationRepository


class NotificationService:
    def __init__(self, db):
        self.db = db
        self.repository = NotificationRepository(db)

    async def _ensure_enabled(self, school_id: int):
        return True

    async def _get_current_student(self, current_user):
        result = await self.db.execute(
            select(Student).where(
                Student.user_id == current_user.id,
                Student.school_id == current_user.school_id,
            )
        )

        return result.scalar_one_or_none()

    async def _get_current_parent_student_ids(self, current_user):
        result = await self.db.execute(
            select(Parent).where(
                Parent.user_id == current_user.id,
                Parent.school_id == current_user.school_id,
            )
        )

        parent = result.scalar_one_or_none()

        if not parent:
            return []

        student_ids = []

        # Normal single-child relationship
        student_id = getattr(parent, "student_id", None)

        if student_id:
            student_ids.append(student_id)

        # Some CoreOne versions use children relationship
        children = getattr(parent, "children", None)

        if children:
            for child in children:
                child_id = getattr(child, "id", None)
                if child_id and child_id not in student_ids:
                    student_ids.append(child_id)

        return student_ids

    async def get_notifications(self, current_user):
        await self._ensure_enabled(current_user.school_id)

        role = (
            getattr(current_user.role, "name", "")
            or ""
        ).upper()

        if role == "STUDENT":
            student = await self._get_current_student(current_user)

            if not student:
                return []

            return await self.repository.get_all(
                school_id=current_user.school_id,
                recipient_type="STUDENT",
                student_id=student.id,
            )

        if role == "PARENT":
            student_ids = await self._get_current_parent_student_ids(
                current_user
            )

            return await self.repository.get_all(
                school_id=current_user.school_id,
                recipient_type="PARENT",
                student_ids=student_ids,
            )

        if role == "TEACHER":
            return await self.repository.get_all(
                school_id=current_user.school_id,
                recipient_type="TEACHER",
            )

        return await self.repository.get_all(
            school_id=current_user.school_id,
            recipient_type=None,
        )

    async def clear_all_notifications(self, current_user):
        role = (
            getattr(current_user.role, "name", "")
            or ""
        ).upper()

        if role in ("SUPER_ADMIN", "SCHOOL_ADMIN"):
            cleared = await self.repository.clear_all(
                school_id=current_user.school_id,
            )

            return {"cleared": cleared}

        if role == "STUDENT":
            student = await self._get_current_student(current_user)

            if not student:
                return {"cleared": 0}

            cleared = await self.repository.clear_all(
                school_id=current_user.school_id,
                recipient_type="STUDENT",
                student_id=student.id,
            )

            return {"cleared": cleared}

        if role == "PARENT":
            student_ids = await self._get_current_parent_student_ids(
                current_user
            )

            cleared = await self.repository.clear_all(
                school_id=current_user.school_id,
                recipient_type="PARENT",
                student_ids=student_ids,
            )

            return {"cleared": cleared}

        if role == "TEACHER":
            cleared = await self.repository.clear_all(
                school_id=current_user.school_id,
                recipient_type="TEACHER",
            )

            return {"cleared": cleared}

        cleared = await self.repository.clear_all(
            school_id=current_user.school_id,
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
                    detail="Student profile not found",
                )

            if recipient is not None:
                allowed = {
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

            for student_id in student_ids:
                allowed.add(f"STUDENT:{student_id}")

            if recipient not in allowed:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Notification not found",
                )

        elif role == "TEACHER":
            if recipient not in (None, "TEACHER"):
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Notification not found",
                )

        return notification
