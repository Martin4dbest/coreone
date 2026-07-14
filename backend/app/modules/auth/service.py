from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.auth.exceptions import InvalidCredentialsException
from app.modules.auth.email_service import send_password_reset_email
from app.modules.auth.jwt import (
    create_access_token,
    create_password_reset_token,
    decode_access_token,
)
from app.modules.auth.repository import AuthRepository
from app.modules.auth.security import (
    hash_password,
    verify_password,
)


class AuthService:

    def __init__(self, db: AsyncSession):
        self.repository = AuthRepository(db)

    async def login(
        self,
        email: str,
        password: str,
    ):
        user = await self.repository.get_user_by_email(email)

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

    async def reset_password(
        self,
        token: str,
        new_password: str,
    ) -> bool:
        payload = decode_access_token(token)

        if not payload:
            return False

        if payload.get("token_type") != "password_reset":
            return False

        user_id = payload.get("sub")

        if not user_id:
            return False

        try:
            user_id_int = int(user_id)
        except (TypeError, ValueError):
            return False

        user = await self.repository.get_user_by_id(user_id_int)

        if user is None:
            return False

        user.hashed_password = hash_password(new_password)

        await self.repository.update_user(user)

        return True
