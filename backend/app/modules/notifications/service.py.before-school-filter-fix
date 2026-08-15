from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification
from app.modules.notifications.repository import NotificationRepository
from app.modules.notifications.schemas import NotificationCreateRequest


class NotificationService:

    def __init__(self, db: AsyncSession):
        self.repository = NotificationRepository(db)

    async def create_notification(
        self,
        payload: NotificationCreateRequest,
    ):
        notification = Notification(
            school_id=payload.school_id,
            title=payload.title,
            message=payload.message,
            recipient_type=payload.recipient_type,
            is_active=True,
        )

        return await self.repository.create(notification)

    async def get_notifications(self):
        return await self.repository.get_all()

    async def get_notification(
        self,
        notification_id: int,
    ):
        notification = await self.repository.get_by_id(
            notification_id
        )

        if not notification:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification not found",
            )

        return notification