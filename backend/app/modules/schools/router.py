from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.modules.auth.dependencies.current_user import get_current_user
from app.modules.schools.schemas import (
    SchoolCreateRequest,
    SchoolResponse,
)
from app.modules.schools.service import SchoolService

router = APIRouter(
    prefix="/schools",
    tags=["Schools"],
)


@router.post(
    "",
    response_model=SchoolResponse,
)
async def create_school(
    payload: SchoolCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    service = SchoolService(db)
    return await service.create_school(payload)


@router.get(
    "",
    response_model=list[SchoolResponse],
)
async def get_schools(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    service = SchoolService(db)
    return await service.get_schools()


@router.get(
    "/{school_id}",
    response_model=SchoolResponse,
)
async def get_school(
    school_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    service = SchoolService(db)
    return await service.get_school(school_id)

@router.patch("/{school_id}/deactivate")
async def deactivate_school(
    school_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await SchoolService(db).deactivate_school(
        school_id
    )


@router.patch("/{school_id}/activate")
async def activate_school(
    school_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await SchoolService(db).activate_school(
        school_id
    )

