from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.message import Message


class MessageRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self):
        result = await self.db.execute(
            select(Message).order_by(
                Message.sent_at.desc()
            )
        )
        return result.scalars().all()

    async def get_by_id(self, message_id: int):
        result = await self.db.execute(
            select(Message).where(
                Message.id == message_id
            )
        )
        return result.scalar_one_or_none()

    async def create(self, message: Message):
        self.db.add(message)
        await self.db.commit()
        await self.db.refresh(message)
        return message
