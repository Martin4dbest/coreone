from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.user import User
from app.modules.auth.dependencies.current_user import get_current_user
from app.modules.payments.schemas import (
    PaymentInitializeRequest,
    PaymentInitializeResponse,
    PaymentSettingsResponse,
    PaymentSettingsStatusResponse,
    PaymentSettingsUpdateRequest,
)
from app.modules.payments.service import PaymentService


router = APIRouter(
    prefix="/payments",
    tags=["Payments"],
)


@router.get(
    "/settings",
    response_model=PaymentSettingsStatusResponse,
)
async def get_payment_settings(
    school_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await PaymentService(db).get_settings(
        current_user,
        school_id,
    )


@router.post(
    "/initialize",
    response_model=PaymentInitializeResponse,
)
async def initialize_parent_payment(
    payload: PaymentInitializeRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await PaymentService(db).initialize_parent_payment(
        current_user=current_user,
        student_fee_id=payload.student_fee_id,
        requested_amount=payload.amount,
    )


@router.put(
    "/settings",
    response_model=PaymentSettingsResponse,
)
async def update_payment_settings(
    payload: PaymentSettingsUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await PaymentService(db).update_settings(
        payload,
        current_user,
    )
