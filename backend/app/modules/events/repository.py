from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.event import Event


class EventRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self):
        result = await self.db.execute(
            select(Event).order_by(Event.event_date)
        )
        return result.scalars().all()

    async def get_by_id(self, event_id: int):
        result = await self.db.execute(
            select(Event).where(
                Event.id == event_id
            )
        )
        return result.scalar_one_or_none()

    async def create(self, event: Event):
        self.db.add(event)
        await self.db.commit()
        await self.db.refresh(event)
        return event
