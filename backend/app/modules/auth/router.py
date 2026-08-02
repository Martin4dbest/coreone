from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.tenant.dependencies import get_current_tenant
from app.core.tenant.context import TenantContext
from app.db.database import get_db
from app.models.user import User
from app.modules.auth.dependencies.current_user import get_current_user
from app.modules.auth.mobile_schemas import (
    MobileLoginRequest,
    MobileLoginResponse,
)

from app.modules.auth.schemas import (
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    ResetPasswordRequest,
    ResetPasswordResponse,
    TokenResponse,
    ChangePasswordRequest,
    ChangePasswordResponse,
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

    result = await service.login(
        form_data.username,
        form_data.password,
        tenant,
    )

    current_user = await service.repository.get_user_by_email(
        email=form_data.username,
    )

    if current_user.role.name not in (
        "SUPER_ADMIN",
        "SCHOOL_ADMIN",
    ):
        from fastapi import HTTPException

        raise HTTPException(
            status_code=403,
            detail="This portal is for School Administrators only. Please use the appropriate portal for your account."
        )

    return result


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

@router.post(
    "/mobile-login",
    response_model=MobileLoginResponse,
)
async def mobile_login(
    payload: MobileLoginRequest,
    db: AsyncSession = Depends(get_db),
):
    service = AuthService(db)

    return await service.mobile_login(
        payload.school_code,
        payload.email,
        payload.password,
    )


@router.post(
    "/change-password",
    response_model=ChangePasswordResponse,
)
async def change_password(
    payload: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):

    service = AuthService(db)

    return await service.change_password(
        current_user,
        payload.current_password,
        payload.new_password,
    )
