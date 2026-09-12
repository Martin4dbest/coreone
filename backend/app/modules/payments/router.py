from fastapi import APIRouter, Depends, Header, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.user import User
from app.modules.auth.dependencies.current_user import get_current_user
from app.modules.payments.schemas import (
    PaymentInitializeRequest,
    PaymentInitializeResponse,
    PaymentVerifyRequest,
    PaymentVerifyResponse,
    PaymentSettingsResponse,
    PaymentSettingsStatusResponse,
    PaymentSettingsUpdateRequest,
    PaymentHistoryResponse,
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


@router.get(
    "/history",
    response_model=PaymentHistoryResponse,
)
async def get_school_payment_history(
    school_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await PaymentService(db).get_school_payment_history(
        current_user=current_user,
        school_id=school_id,
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


@router.post(
    "/verify",
    response_model=PaymentVerifyResponse,
)
async def verify_parent_payment(
    payload: PaymentVerifyRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await PaymentService(db).verify_parent_payment(
        current_user=current_user,
        reference=payload.reference,
    )


@router.get(
    "/callback",
)
async def paystack_callback(
    reference: str | None = None,
    trxref: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    payment_reference = (reference or trxref or "").strip()

    if not payment_reference:
        from fastapi import HTTPException

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Paystack payment reference is missing",
        )

    await PaymentService(db).verify_payment_from_callback(
        reference=payment_reference,
    )

    from fastapi.responses import RedirectResponse

    return RedirectResponse(
        url=(
            "https://presense.expo.app/parent/payment-success"
            f"?reference={payment_reference}"
        ),
        status_code=303,
    )


@router.post(
    "/webhook",
)
async def paystack_webhook(
    request: Request,
    x_paystack_signature: str | None = Header(
        default=None,
        alias="x-paystack-signature",
    ),
    db: AsyncSession = Depends(get_db),
):
    payload = await request.body()

    return await PaymentService(db).process_paystack_webhook(
        payload=payload,
        signature=x_paystack_signature,
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
