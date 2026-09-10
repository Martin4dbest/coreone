from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class PaymentSettingsUpdateRequest(BaseModel):
    school_id: int = Field(gt=0)
    provider: str = Field(default="paystack", min_length=2, max_length=50)
    is_enabled: bool = False
    public_key: str | None = Field(default=None, max_length=255)
    secret_key: str | None = Field(default=None, min_length=1)
    currency: str = Field(default="NGN", min_length=3, max_length=10)


class PaymentSettingsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    uuid: str
    school_id: int
    provider: str
    is_enabled: bool
    public_key: str | None
    has_secret_key: bool
    currency: str


class PaymentSettingsStatusResponse(BaseModel):
    school_id: int
    configured: bool
    enabled: bool
    provider: str | None
    currency: str | None


class PaymentInitializeRequest(BaseModel):
    student_fee_id: int = Field(gt=0)

    amount: Decimal | None = Field(
        default=None,
        gt=0,
    )


class PaymentInitializeResponse(BaseModel):
    payment_id: int
    reference: str
    amount: Decimal
    currency: str
    provider: str
    authorization_url: str
    access_code: str | None = None


class PaymentVerifyRequest(BaseModel):
    reference: str = Field(min_length=1, max_length=150)


class PaymentVerifyResponse(BaseModel):
    payment_id: int
    reference: str
    status: str
    amount: Decimal
    currency: str
    payment_idempotent: bool = False
    student_fee_id: int
    amount_paid: Decimal
    outstanding_balance: Decimal
    fee_status: str
