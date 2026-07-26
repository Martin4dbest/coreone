from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.tenant.dependencies import get_current_tenant
from app.core.tenant.context import TenantContext
from app.db.database import get_db
from app.models.user import User
from app.modules.auth.dependencies.current_user import get_current_user
from app.modules.auth.schemas import (
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    ResetPasswordRequest,
    ResetPasswordResponse,
    TokenResponse,
)
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
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
    tenant: TenantContext = Depends(get_current_tenant),
):
    service = AuthService(db)

    return await service.login(
        form_data.username,
        form_data.password,
        tenant,
    )


@router.get(
    "/me",
    response_model=CurrentUserResponse,
)
async def me(
    current_user: User = Depends(get_current_user),
):
    return current_user


@router.post(
    "/forgot-password",
    response_model=ForgotPasswordResponse,
)
async def forgot_password(
    payload: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    service = AuthService(db)

    await service.create_password_reset(payload.email)

    return {
        "message": (
            "If an account exists for this email, "
            "password reset instructions will be sent."
        )
    }


@router.post(
    "/reset-password",
    response_model=ResetPasswordResponse,
)
async def reset_password(
    payload: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    service = AuthService(db)

    success = await service.reset_password(
        payload.token,
        payload.new_password,
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired password reset token.",
        )

    return {
        "message": "Password reset successfully."
    }
