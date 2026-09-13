from fastapi import APIRouter, Depends, Header, Request, HTTPException, status
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
        return_url=payload.return_url,
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
    return_url: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    payment_reference = (reference or trxref or "").strip()

    if not payment_reference:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Paystack payment reference is missing",
        )

    payment_service = PaymentService(db)

    payment = await payment_service.repository.get_payment_by_reference(
        payment_reference,
        for_update=False,
    )

    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found",
        )

    student_fee = payment.student_fee

    if student_fee is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Payment is missing its student fee",
        )

    student_id = student_fee.student_id

    await payment_service.verify_payment_from_callback(
        reference=payment_reference,
    )

    # The frontend supplied the exact /parent/fees URL it wants
    # to return to. Preserve its origin so localhost, LAN,
    # Expo Web, staging, and production all work.
    from urllib.parse import (
        parse_qsl,
        urlencode,
        urlsplit,
        urlunsplit,
    )

    target = (
        return_url.strip()
        if return_url and return_url.strip()
        else "https://presense.expo.app/parent/fees"
    )

    parsed = urlsplit(target)

    if parsed.scheme not in {"http", "https"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid payment return URL",
        )

    if not parsed.netloc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid payment return URL",
        )

    if parsed.path.rstrip("/") != "/parent/fees":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment return URL must point to the Parent School Fees page",
        )

    query = dict(
        parse_qsl(
            parsed.query,
            keep_blank_values=True,
        )
    )

    query["studentId"] = str(student_id)

    redirect_url = urlunsplit(
        (
            parsed.scheme,
            parsed.netloc,
            parsed.path,
            urlencode(query),
            parsed.fragment,
        )
    )

    from fastapi.responses import RedirectResponse

    return RedirectResponse(
        url=redirect_url,
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
