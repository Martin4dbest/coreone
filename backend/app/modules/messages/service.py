from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.message import Message
from app.modules.messages.repository import MessageRepository
from app.modules.messages.schemas import MessageCreateRequest


class MessageService:

    def __init__(self, db: AsyncSession):
        self.repository = MessageRepository(db)

    async def create_message(
        self,
        payload: MessageCreateRequest,
    ):
        message = Message(
            school_id=payload.school_id,
            sender_id=payload.sender_id,
            receiver_id=payload.receiver_id,
            subject=payload.subject,
            content=payload.content,
            is_active=True,
        )

        return await self.repository.create(message)

    async def get_messages(self):
        return await self.repository.get_all()

    async def get_message(
        self,
        message_id: int,
    ):
        message = await self.repository.get_by_id(
            message_id
        )

        if not message:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Message not found",
            )

        return message
