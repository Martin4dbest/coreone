from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.user import User
from app.modules.auth.dependencies.current_user import get_current_user
from app.modules.messages.schemas import (
    MessageCreateRequest,
    MessageResponse,
)
from app.modules.messages.service import MessageService


router = APIRouter(
    prefix="/messages",
    tags=["Messages"],
)


@router.post(
    "",
    response_model=MessageResponse,
)
async def create_message(
    payload: MessageCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await MessageService(db).create_message(payload)


@router.get(
    "",
    response_model=list[MessageResponse],
)
async def get_messages(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await MessageService(db).get_messages()


@router.get(
    "/{message_id}",
    response_model=MessageResponse,
)
async def get_message(
    message_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await MessageService(db).get_message(message_id)