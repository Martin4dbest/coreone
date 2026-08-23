from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.user import User
from app.core.permissions import require_roles
from app.modules.users.schemas import (
    UserCreateRequest,
    UserResponse,
    UserStatusUpdate,
)
from app.modules.users.service import UserService


router = APIRouter(
    prefix="/users",
    tags=["Users"],
)


@router.post(
    "",
    response_model=UserResponse,
)
async def create_user(
    payload: UserCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "SUPER_ADMIN",
            "SCHOOL_ADMIN",
        )
    ),
):
    service = UserService(db)

    return await service.create_user(
        payload,
        current_user,
    )


@router.get(
    "",
    response_model=list[UserResponse],
)
async def get_users(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "SUPER_ADMIN",
            "SCHOOL_ADMIN",
        )
    ),
):
    service = UserService(db)

    return await service.get_users(
        current_user
    )


@router.get(
    "/{user_id}",
    response_model=UserResponse,
)
async def get_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "SUPER_ADMIN",
            "SCHOOL_ADMIN",
        )
    ),
):
    service = UserService(db)

    return await service.get_user(
        user_id,
        current_user,
    )


@router.patch(
    "/{user_id}/status",
    response_model=UserResponse,
)
async def update_status(
    user_id: int,
    payload: UserStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "SUPER_ADMIN",
            "SCHOOL_ADMIN",
        )
    ),
):
    service = UserService(db)

    return await service.update_status(
        user_id,
        payload,
        current_user,
    )