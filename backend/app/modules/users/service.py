from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.modules.auth.security import hash_password
from app.modules.users.repository import UserRepository
from app.modules.users.schemas import (
    UserCreateRequest,
    UserStatusUpdate,
)


class UserService:

    def __init__(self, db: AsyncSession):
        self.repository = UserRepository(db)


    async def create_user(
        self,
        payload: UserCreateRequest,
    ):
        existing_user = await self.repository.get_by_email(
            payload.email
        )

        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already exists",
            )

        user = User(
            school_id=payload.school_id,
            role_id=payload.role_id,
            email=payload.email,
            hashed_password=hash_password(
                payload.password
            ),
            is_active=True,
            is_verified=False,
        )

        return await self.repository.create(user)


    async def get_users(self):
        return await self.repository.get_all()


    async def get_user(
        self,
        user_id: int,
    ):
        user = await self.repository.get_by_id(user_id)

        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found",
            )

        return user


    async def update_status(
        self,
        user_id: int,
        payload: UserStatusUpdate,
    ):
        user = await self.get_user(user_id)

        user.is_active = payload.is_active

        return await self.repository.update(user)


    async def create_internal_user(
        self,
        *,
        email: str,
        password: str,
        school_id: int,
        role_id: int,
    ):
        existing_user = await self.repository.get_by_email(
            email
        )

        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already exists",
            )

        user = User(
            school_id=school_id,
            role_id=role_id,
            email=email,
            hashed_password=hash_password(password),
            is_active=True,
            is_verified=False,
        )

        return await self.repository.create(user)
