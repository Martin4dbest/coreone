from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification


class NotificationRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(
        self,
        school_id: int,
        recipient_type: str | None = None,
        student_id: int | None = None,
        student_ids: list[int] | None = None,
    ):
        query = (
            select(Notification)
            .where(
                Notification.school_id == school_id,
                Notification.is_active.is_(True),
            )
            .order_by(Notification.sent_at.desc())
        )

        if recipient_type == "STUDENT":
            conditions = [
                Notification.recipient_type.is_(None),
            ]

            if student_id is not None:
                conditions.append(
                    Notification.recipient_type == f"STUDENT:{student_id}"
                )

            query = query.where(or_(*conditions))

        elif recipient_type == "PARENT":
            conditions = [
                Notification.recipient_type.is_(None),
                Notification.recipient_type == "PARENT",
            ]

            if student_ids:
                conditions.extend(
                    Notification.recipient_type == f"STUDENT:{student_id}"
                    for student_id in student_ids
                )

            query = query.where(or_(*conditions))

        elif recipient_type == "TEACHER":
            query = query.where(
                or_(
                    Notification.recipient_type.is_(None),
                    Notification.recipient_type == "TEACHER",
                )
            )

        elif recipient_type is not None:
            query = query.where(
                or_(
                    Notification.recipient_type.is_(None),
                    Notification.recipient_type == recipient_type,
                )
            )

        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_by_id(
        self,
        notification_id: int,
        school_id: int,
    ):
        result = await self.db.execute(
            select(Notification).where(
                Notification.id == notification_id,
                Notification.school_id == school_id,
                Notification.is_active.is_(True),
            )
        )

        return result.scalar_one_or_none()

    async def clear_all(
        self,
        school_id: int,
        recipient_type: str | None = None,
        student_id: int | None = None,
        student_ids: list[int] | None = None,
    ):
        query = select(Notification).where(
            Notification.school_id == school_id,
            Notification.is_active.is_(True),
        )

        if recipient_type == "STUDENT":
            conditions = [
                Notification.recipient_type.is_(None),
            ]

            if student_id is not None:
                conditions.append(
                    Notification.recipient_type == f"STUDENT:{student_id}"
                )

            query = query.where(or_(*conditions))

        elif recipient_type == "PARENT":
            conditions = [
                Notification.recipient_type.is_(None),
                Notification.recipient_type == "PARENT",
            ]

            if student_ids:
                conditions.extend(
                    Notification.recipient_type == f"STUDENT:{student_id}"
                    for student_id in student_ids
                )

            query = query.where(or_(*conditions))

        elif recipient_type == "TEACHER":
            query = query.where(
                or_(
                    Notification.recipient_type.is_(None),
                    Notification.recipient_type == "TEACHER",
                )
            )

        elif recipient_type is not None:
            query = query.where(
                or_(
                    Notification.recipient_type.is_(None),
                    Notification.recipient_type == recipient_type,
                )
            )

        result = await self.db.execute(query)
        notifications = result.scalars().all()

        for notification in notifications:
            notification.is_active = False

        await self.db.commit()

        return len(notifications)
