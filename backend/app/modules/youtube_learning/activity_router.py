from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.user import User
from app.modules.auth.dependencies.current_user import get_current_user
from app.modules.youtube_learning.activity_schemas import (
    YoutubeActivityResponse,
)
from app.modules.youtube_learning.activity_service import (
    YoutubeActivityService,
)

router = APIRouter(
    prefix="/youtube-learning",
    tags=["YouTube Learning Activity"],
)


@router.post(
    "/{video_id}/activity",
)
async def record_youtube_activity(
    video_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await YoutubeActivityService(db).record_activity(
        video_id,
        current_user,
    )

    return {
        "message": "YouTube activity recorded successfully"
    }


@router.get(
    "/activity",
    response_model=list[YoutubeActivityResponse],
)
async def get_youtube_activity(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await YoutubeActivityService(db).get_activity(
        current_user
    )
