from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.user import User

from app.modules.auth.dependencies.current_user import get_current_user
from app.modules.classes.schemas import (
    ClassCreateRequest,
    ClassResponse,
)
from app.modules.classes.service import ClassService


router = APIRouter(
    prefix="/classes",
    tags=["Classes"],
)


@router.post(
    "",
    response_model=ClassResponse,
)
async def create_class(
    payload: ClassCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await ClassService(db).create_class(
        payload,
        current_user,
    )


@router.get(
    "",
    response_model=list[ClassResponse],
)
async def get_classes(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await ClassService(db).get_classes(
        current_user
    )


@router.get(
    "/{class_id}",
    response_model=ClassResponse,
)
async def get_class(
    class_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await ClassService(db).get_class(
        class_id,
        current_user,
    )

@router.patch("/{class_id}/deactivate")
async def deactivate_class(
    class_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await ClassService(db).deactivate_class(
        class_id,
        current_user,
    )


@router.patch("/{class_id}/activate")
async def activate_class(
    class_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await ClassService(db).activate_class(
        class_id,
        current_user,
    )

