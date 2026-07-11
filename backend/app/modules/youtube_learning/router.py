from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.user import User
from app.modules.auth.dependencies.current_user import get_current_user
from app.modules.youtube_learning.schemas import (
    YoutubeLearningCreateRequest,
    YoutubeLearningResponse,
)
from app.modules.youtube_learning.service import YoutubeLearningService


router = APIRouter(
    prefix="/youtube-learning",
    tags=["YouTube Learning"],
)


@router.post(
    "",
    response_model=YoutubeLearningResponse,
)
async def create_video(
    payload: YoutubeLearningCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await YoutubeLearningService(db).create_video(
        payload
    )


@router.get(
    "",
    response_model=list[YoutubeLearningResponse],
)
async def get_videos(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await YoutubeLearningService(db).get_videos()


@router.get(
    "/{video_id}",
    response_model=YoutubeLearningResponse,
)
async def get_video(
    video_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await YoutubeLearningService(db).get_video(
        video_id
    )
