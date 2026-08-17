from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.modules.auth.security import hash_password
from app.modules.roles.repository import RoleRepository
from app.modules.users.repository import UserRepository
from app.modules.users.schemas import (
    UserCreateRequest,
    UserStatusUpdate,
)


class UserService:
    def __init__(self, db: AsyncSession):
        self.repository = UserRepository(db)
        self.role_repository = RoleRepository(db)

    def _resolve_school_id(
        self,
        current_user: User,
        requested_school_id: int,
    ) -> int:
        if current_user.role.name == "SUPER_ADMIN":
            return requested_school_id

        if requested_school_id != current_user.school_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You cannot manage users outside your school",
            )

        return current_user.school_id

    def _ensure_user_access(
        self,
        current_user: User,
        user: User,
    ) -> None:
        if current_user.role.name == "SUPER_ADMIN":
            return

        if user.school_id != current_user.school_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You cannot access users outside your school",
            )

    async def _validate_role_assignment(
        self,
        current_user: User,
        role_id: int,
    ):
        role = await self.role_repository.get_by_id(role_id)

        if role is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Role not found",
            )

        if not role.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot assign an inactive role",
            )

        if (
            current_user.role.name != "SUPER_ADMIN"
            and role.name == "SUPER_ADMIN"
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only a Super Admin can assign the SUPER_ADMIN role",
            )

        if (
            current_user.role.name == "SCHOOL_ADMIN"
            and role.name == "SCHOOL_ADMIN"
            and not getattr(
                current_user,
                "is_primary_school_admin",
                False,
            )
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "Only the Primary School Admin can "
                    "create additional School Administrators."
                ),
            )

        return role

    async def create_user(
        self,
        payload: UserCreateRequest,
        current_user: User,
    ):
        school_id = self._resolve_school_id(
            current_user,
            payload.school_id,
        )

        role = await self._validate_role_assignment(
            current_user,
            payload.role_id,
        )

        existing_user = await self.repository.get_by_email(
            payload.email
        )

        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already exists",
            )

        is_primary_school_admin = False

        if role.name == "SCHOOL_ADMIN":
            if current_user.role.name == "SUPER_ADMIN":
                existing_admin = await self.repository.get_first_school_admin(
                    school_id
                )

                if existing_admin is None:
                    is_primary_school_admin = True
            elif current_user.role.name == "SCHOOL_ADMIN":
                is_primary_school_admin = False

        user = User(
            school_id=school_id,
            role_id=payload.role_id,
            email=payload.email,
            hashed_password=hash_password(payload.password),
            is_active=True,
            is_verified=role.name == "SCHOOL_ADMIN",
            is_primary_school_admin=is_primary_school_admin,
        )

        return await self.repository.create(user)

    async def get_users(
        self,
        current_user: User,
    ):
        if current_user.role.name == "SUPER_ADMIN":
            return await self.repository.get_all()

        return await self.repository.get_all_by_school(
            current_user.school_id
        )

    async def get_user(
        self,
        user_id: int,
        current_user: User,
    ):
        user = await self.repository.get_by_id(user_id)

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

        self._ensure_user_access(current_user, user)

        return user

    async def update_status(
        self,
        user_id: int,
        payload: UserStatusUpdate,
        current_user: User,
    ):
        user = await self.get_user(
            user_id,
            current_user,
        )

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
        existing_user = await self.repository.get_by_email(email)

        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already exists",
            )

        role = await self.role_repository.get_by_id(role_id)

        if role is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Role not found",
            )

        is_primary_school_admin = False

        if role.name == "SCHOOL_ADMIN":
            existing_admin = await self.repository.get_first_school_admin(
                school_id
            )

            if existing_admin is None:
                is_primary_school_admin = True

        user = User(
            school_id=school_id,
            role_id=role_id,
            email=email,
            hashed_password=hash_password(password),
            is_active=True,
            is_verified=role.name == "SCHOOL_ADMIN",
            is_primary_school_admin=is_primary_school_admin,
        )

        return await self.repository.create(user)