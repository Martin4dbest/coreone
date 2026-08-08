from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.user import User
from app.modules.auth.dependencies.current_user import get_current_user
from app.modules.events.schemas import (
    EventCreateRequest,
    EventResponse,
)
from app.modules.events.service import EventService


router = APIRouter(
    prefix="/events",
    tags=["Events"],
)


@router.post(
    "",
    response_model=EventResponse,
)
async def create_event(
    payload: EventCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await EventService(db).create_event(payload)


@router.get(
    "",
    response_model=list[EventResponse],
)
async def get_events(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await EventService(db).get_events()


@router.get(
    "/{event_id}",
    response_model=EventResponse,
)
async def get_event(
    event_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await EventService(db).get_event(event_id)