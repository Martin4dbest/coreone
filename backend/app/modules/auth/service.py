from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.auth.jwt import create_access_token, create_password_reset_token
from app.modules.auth.security import verify_password

from app.modules.auth.exceptions import InvalidCredentialsException
from app.core.tenant.context import TenantContext

from app.modules.auth.repository import AuthRepository
from app.modules.auth.email_service import send_password_reset_email


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
