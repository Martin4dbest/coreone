from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.event import Event
from app.modules.events.repository import EventRepository
from app.modules.events.schemas import EventCreateRequest


class EventService:

    def __init__(self, db: AsyncSession):
        self.repository = EventRepository(db)

    async def create_event(
        self,
        payload: EventCreateRequest,
    ):
        event = Event(
            school_id=payload.school_id,
            title=payload.title,
            description=payload.description,
            event_date=payload.event_date,
            location=payload.location,
            is_active=True,
        )

        return await self.repository.create(event)

    async def get_events(self):
        return await self.repository.get_all()

    async def get_event(self, event_id: int):
        event = await self.repository.get_by_id(event_id)

        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event not found",
            )

        return event
