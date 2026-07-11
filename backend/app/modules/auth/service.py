from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.auth.exceptions import InvalidCredentialsException
from app.modules.auth.jwt import create_access_token
from app.modules.auth.repository import AuthRepository
from app.modules.auth.security import verify_password


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
