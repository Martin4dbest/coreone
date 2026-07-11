from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.user import User
from app.modules.auth.dependencies.current_user import get_current_user
from app.modules.auth.schemas import LoginRequest, TokenResponse
from app.modules.auth.schema_user import CurrentUserResponse
from app.modules.auth.service import AuthService

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


@router.post(
    "/login",
    response_model=TokenResponse,
)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    service = AuthService(db)
    return await service.login(
        form_data.username,
        form_data.password
    )


@router.get(
    "/me",
    response_model=CurrentUserResponse,
)
async def me(
    current_user: User = Depends(get_current_user),
):
    return current_user
