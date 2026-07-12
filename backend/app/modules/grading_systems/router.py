from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.user import User
from app.modules.auth.dependencies.current_user import (
    get_current_user,
)
from app.modules.grading_systems.schemas import (
    GradingSystemCreateRequest,
    GradingSystemResponse,
)
from app.modules.grading_systems.service import (
    GradingSystemService,
)


router = APIRouter(
    prefix="/grading-systems",
    tags=["Grading Systems"],
)


@router.post(
    "",
    response_model=GradingSystemResponse,
)
async def create_grading_system(
    payload: GradingSystemCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await GradingSystemService(db).create_grading_system(
        payload
    )


@router.get(
    "",
    response_model=list[GradingSystemResponse],
)
async def get_grading_systems(
    school_id: int | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await GradingSystemService(db).get_grading_systems(school_id)


@router.get(
    "/{grading_system_id}",
    response_model=GradingSystemResponse,
)
async def get_grading_system(
    grading_system_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await GradingSystemService(db).get_grading_system(
        grading_system_id
    )
