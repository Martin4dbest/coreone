from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.user import User
from app.modules.auth.dependencies.current_user import (
    get_current_user,
)
from app.modules.grading_systems.schemas import (
    GradingSystemCreateRequest,
    GradingSystemUpdateRequest,
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
        payload,
        current_user,
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
    return await GradingSystemService(db).get_grading_systems(
        school_id,
        current_user,
    )


@router.put(
    "/{grading_system_id}",
    response_model=GradingSystemResponse,
)
async def update_grading_system(
    grading_system_id: int,
    payload: GradingSystemUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await GradingSystemService(db).update_grading_system(
        grading_system_id,
        payload,
        current_user,
    )


@router.delete(
    "/{grading_system_id}",
)
async def delete_grading_system(
    grading_system_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await GradingSystemService(db).delete_grading_system(
        grading_system_id,
        current_user,
    )


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
