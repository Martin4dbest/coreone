from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.auth.jwt import create_access_token, create_password_reset_token
from app.modules.auth.security import (
    verify_password,
    hash_password,
)

from app.modules.auth.exceptions import InvalidCredentialsException
from app.core.tenant.context import TenantContext

from app.modules.auth.repository import AuthRepository
from app.modules.auth.email_service import send_password_reset_email
from app.modules.schools.repository import SchoolRepository


class AuthService:

    def __init__(self, db: AsyncSession):
        self.repository = AuthRepository(db)

    async def login(
        self,
        email: str,
        password: str,
        tenant: TenantContext,
    ):
        user = await self.repository.get_user_by_email(
            email=email,
        )

        if user is None:
            raise InvalidCredentialsException()

        if not verify_password(
            password,
            user.hashed_password,
        ):
            raise InvalidCredentialsException()

        #
        # Tenant access enforcement
        #
        if (
            tenant.resolved
            and tenant.school_id is not None
        ):
            #
            # Only non-super admins are restricted
            # to their tenant school.
            #
            if (
                user.role
                and user.role.name != "SUPER_ADMIN"
                and user.school_id != tenant.school_id
            ):
                raise InvalidCredentialsException()

        access_token = create_access_token(
            {
                "sub": str(user.id),
                "school_id": user.school_id,
                "role_id": user.role_id,
            }
        )

        return {
            "access_token": access_token,
            "token_type": "bearer",
        }



    async def create_password_reset(
        self,
        email: str,
    ) -> str | None:

        user = await self.repository.get_user_by_email(email)

        if user is None:
            return None

        reset_token = create_password_reset_token(user.id)

        send_password_reset_email(
            user.email,
            reset_token,
        )

        return reset_token


    async def mobile_login(
        self,
        school_code: str,
        email: str,
        password: str,
    ):

        school_repository = SchoolRepository(
            self.repository.db
        )

        school = await school_repository.get_by_code(
            school_code
        )

        if school is None:
            raise InvalidCredentialsException()


        user = await self.repository.get_user_by_email(
            email=email,
            school_id=school.id,
        )


        if user is None:
            raise InvalidCredentialsException()


        if not verify_password(
            password,
            user.hashed_password,
        ):
            raise InvalidCredentialsException()


        access_token = create_access_token(
            {
                "sub": str(user.id),
                "school_id": user.school_id,
                "role_id": user.role_id,
            }
        )


        return {
            "access_token": access_token,
            "token_type": "bearer",

            "user": {
                "id": user.id,
                "email": user.email,
                "role": user.role.name,
                "school_id": user.school_id,
                "must_change_password": user.must_change_password,
            },

            "tenant": {
                "id": school.id,
                "name": school.name,
                "school_code": school.school_code,
            },
        }

    async def change_password(
        self,
        user,
        current_password: str,
        new_password: str,
    ):

        if not verify_password(
            current_password,
            user.hashed_password,
        ):
            raise InvalidCredentialsException()


        user.hashed_password = hash_password(
            new_password
        )

        user.must_change_password = False


        await self.repository.db.commit()

        await self.repository.db.refresh(
            user
        )


        return {
            "message": "Password changed successfully.",
            "must_change_password": False,
        }
