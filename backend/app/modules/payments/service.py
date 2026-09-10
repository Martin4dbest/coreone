from __future__ import annotations

from decimal import Decimal, ROUND_HALF_UP
from uuid import uuid4

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.payment import Payment
from app.models.school_payment_setting import SchoolPaymentSetting
from app.modules.payments.crypto import PaymentCredentialCrypto
from app.modules.payments.gateway import PaystackGateway, PaystackGatewayError
from app.modules.payments.repository import PaymentRepository
from app.modules.payments.schemas import PaymentSettingsUpdateRequest


MANAGEMENT_ROLES = {
    "SUPER_ADMIN",
    "SCHOOL_ADMIN",
}

PARENT_ROLE = "PARENT"

MONEY = Decimal("0.01")


class PaymentService:

    def __init__(self, db: AsyncSession):
        self.repository = PaymentRepository(db)

    @staticmethod
    def _role_name(current_user) -> str:
        return current_user.role.name

    @classmethod
    def _resolve_school_id(
        cls,
        current_user,
        requested_school_id: int,
    ) -> int:
        role = cls._role_name(current_user)

        if role not in MANAGEMENT_ROLES:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to manage payment settings",
            )

        if role != "SUPER_ADMIN":
            if requested_school_id != current_user.school_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You cannot manage another school's payment settings",
                )

        return requested_school_id

    @staticmethod
    def _validate_provider(provider: str) -> str:
        provider = provider.strip().lower()

        if provider not in {"paystack"}:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unsupported payment provider",
            )

        return provider

    @staticmethod
    def _validate_currency(currency: str) -> str:
        currency = currency.strip().upper()

        if currency != "NGN":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only NGN is currently supported",
            )

        return currency

    @staticmethod
    def _money(value: Decimal) -> Decimal:
        return Decimal(value).quantize(
            MONEY,
            rounding=ROUND_HALF_UP,
        )

    @staticmethod
    def _naira_to_kobo(amount: Decimal) -> int:
        amount = PaymentService._money(amount)

        return int(
            (amount * Decimal("100")).to_integral_value(
                rounding=ROUND_HALF_UP,
            )
        )

    @staticmethod
    def _new_reference() -> str:
        return f"COREONE-{uuid4().hex.upper()}"

    @staticmethod
    def _response(settings: SchoolPaymentSetting):
        return {
            "id": settings.id,
            "uuid": str(settings.uuid),
            "school_id": settings.school_id,
            "provider": settings.provider,
            "is_enabled": settings.is_enabled,
            "public_key": settings.public_key,
            "has_secret_key": bool(
                settings.encrypted_secret_key
            ),
            "currency": settings.currency,
        }

    async def get_settings(
        self,
        current_user,
        school_id: int,
    ):
        school_id = self._resolve_school_id(
            current_user,
            school_id,
        )

        settings = await self.repository.get_settings(
            school_id
        )

        if not settings:
            return {
                "school_id": school_id,
                "configured": False,
                "enabled": False,
                "provider": None,
                "currency": None,
            }

        return {
            "school_id": settings.school_id,
            "configured": bool(
                settings.public_key
                and settings.encrypted_secret_key
            ),
            "enabled": settings.is_enabled,
            "provider": settings.provider,
            "currency": settings.currency,
        }

    async def update_settings(
        self,
        payload: PaymentSettingsUpdateRequest,
        current_user,
    ):
        school_id = self._resolve_school_id(
            current_user,
            payload.school_id,
        )

        provider = self._validate_provider(
            payload.provider
        )

        currency = self._validate_currency(
            payload.currency
        )

        settings = await self.repository.get_settings(
            school_id
        )

        if payload.is_enabled:
            if not payload.public_key and not settings:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Paystack public key is required before enabling payments",
                )

            if settings:
                has_secret = bool(
                    settings.encrypted_secret_key
                )
            else:
                has_secret = False

            if not payload.secret_key and not has_secret:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Paystack secret key is required before enabling payments",
                )

        if settings is None:
            if not payload.public_key:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Paystack public key is required",
                )

            if not payload.secret_key:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Paystack secret key is required",
                )

            settings = SchoolPaymentSetting(
                school_id=school_id,
                provider=provider,
                is_enabled=payload.is_enabled,
                public_key=payload.public_key.strip(),
                encrypted_secret_key=(
                    PaymentCredentialCrypto.encrypt(
                        payload.secret_key.strip()
                    )
                ),
                currency=currency,
            )

            try:
                settings = await self.repository.create_settings(
                    settings
                )
            except Exception as exc:
                await self.repository.db.rollback()
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Payment settings already exist for this school",
                ) from exc

            return self._response(settings)

        settings.provider = provider
        settings.is_enabled = payload.is_enabled
        settings.currency = currency

        if payload.public_key is not None:
            public_key = payload.public_key.strip()

            if public_key:
                settings.public_key = public_key

        if payload.secret_key is not None:
            secret_key = payload.secret_key.strip()

            if secret_key:
                settings.encrypted_secret_key = (
                    PaymentCredentialCrypto.encrypt(
                        secret_key
                    )
                )

        if settings.is_enabled:
            if not settings.public_key:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Paystack public key is required before enabling payments",
                )

            if not settings.encrypted_secret_key:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Paystack secret key is required before enabling payments",
                )

        settings = await self.repository.save_settings(
            settings
        )

        return self._response(settings)

    async def initialize_parent_payment(
        self,
        *,
        current_user,
        student_fee_id: int,
        requested_amount: Decimal | None,
    ):
        """
        Initialize a payment for an authenticated parent.

        Parent identity, student ownership, school ownership and
        payment credentials are all resolved server-side.
        """

        if self._role_name(current_user) != PARENT_ROLE:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only parents can initialize school fee payments",
            )

        parent = await self.repository.get_parent_by_user_id(
            current_user.id
        )

        if not parent:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Authenticated parent profile was not found",
            )

        student_fee = await self.repository.get_parent_student_fee(
            parent.id,
            student_fee_id,
        )

        if not student_fee:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Fee invoice was not found for one of your children",
            )

        outstanding = self._money(
            student_fee.amount_due
            - student_fee.amount_paid
        )

        if outstanding <= Decimal("0.00"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This fee invoice has no outstanding balance",
            )

        if requested_amount is None:
            amount = outstanding
        else:
            amount = self._money(requested_amount)

            if amount <= Decimal("0.00"):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Payment amount must be greater than zero",
                )

            if amount > outstanding:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        f"Payment amount cannot exceed the outstanding "
                        f"balance of {outstanding}"
                    ),
                )

        settings = await self.repository.get_settings(
            student_fee.school_id
        )

        if not settings:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This school has not configured online payments",
            )

        if not settings.is_enabled:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Online payments are currently disabled by the school",
            )

        if settings.provider != "paystack":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This school's payment provider is not currently supported",
            )

        if not settings.encrypted_secret_key:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This school's Paystack account is not fully configured",
            )

        secret_key = PaymentCredentialCrypto.decrypt(
            settings.encrypted_secret_key
        )

        user = current_user

        if not user.email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Your account does not have an email address required for payment",
            )

        reference = self._new_reference()

        payment = Payment(
            school_id=student_fee.school_id,
            student_fee_id=student_fee.id,
            parent_id=parent.id,
            payment_setting_id=settings.id,
            amount=amount,
            currency=settings.currency,
            provider=settings.provider,
            transaction_reference=reference,
            status="PENDING",
        )

        try:
            await self.repository.create_payment(payment)
        except Exception:
            await self.repository.db.rollback()
            raise

        gateway = PaystackGateway(secret_key)

        try:
            gateway_result = await gateway.initialize_transaction(
                email=user.email,
                amount_kobo=self._naira_to_kobo(amount),
                reference=reference,
                currency=settings.currency,
                metadata={
                    "payment_id": payment.id,
                    "student_fee_id": student_fee.id,
                    "student_id": student_fee.student_id,
                    "school_id": student_fee.school_id,
                    "invoice_number": student_fee.invoice_number,
                },
            )
        except PaystackGatewayError as exc:
            payment.status = "FAILED"
            payment.gateway_response = str(exc)

            await self.repository.save_payment(payment)

            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Unable to initialize payment with the school's payment provider",
            ) from exc
        except Exception:
            payment.status = "FAILED"
            await self.repository.save_payment(payment)
            raise

        authorization_url = gateway_result.get(
            "authorization_url"
        )

        if not authorization_url:
            payment.status = "FAILED"
            payment.gateway_response = (
                "Paystack did not return an authorization URL"
            )

            await self.repository.save_payment(payment)

            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Payment provider returned an invalid authorization response",
            )

        payment.gateway_response = (
            "Paystack transaction initialized successfully"
        )

        await self.repository.save_payment(payment)

        return {
            "payment_id": payment.id,
            "reference": payment.transaction_reference,
            "amount": payment.amount,
            "currency": payment.currency,
            "provider": payment.provider,
            "authorization_url": authorization_url,
            "access_code": gateway_result.get(
                "access_code"
            ),
        }
