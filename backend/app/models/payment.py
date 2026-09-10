from __future__ import annotations

from decimal import Decimal
from datetime import datetime

from sqlalchemy import ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_model import BaseModel
from app.db.database import Base
from app.db.mixins import SchoolMixin


class Payment(Base, BaseModel, SchoolMixin):
    """
    Records a payment attempt/transaction against a student fee.

    Payment success must only be established by the backend after
    gateway verification/webhook processing.
    """

    __tablename__ = "payments"

    student_fee_id: Mapped[int] = mapped_column(
        ForeignKey(
            "student_fees.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    parent_id: Mapped[int | None] = mapped_column(
        ForeignKey(
            "parents.id",
            ondelete="SET NULL",
        ),
        nullable=True,
        index=True,
    )

    payment_setting_id: Mapped[int | None] = mapped_column(
        ForeignKey(
            "school_payment_settings.id",
            ondelete="SET NULL",
        ),
        nullable=True,
        index=True,
    )

    amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )

    currency: Mapped[str] = mapped_column(
        String(10),
        nullable=False,
        default="NGN",
    )

    provider: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="paystack",
        index=True,
    )

    transaction_reference: Mapped[str] = mapped_column(
        String(150),
        unique=True,
        nullable=False,
        index=True,
    )

    gateway_transaction_id: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
        index=True,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="PENDING",
        index=True,
    )

    gateway_response: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    paid_at: Mapped[datetime | None] = mapped_column(
        nullable=True,
    )

    verified_at: Mapped[datetime | None] = mapped_column(
        nullable=True,
    )

    student_fee = relationship(
        "StudentFee",
        back_populates="payments",
    )

    parent = relationship(
        "Parent",
    )

    payment_setting = relationship(
        "SchoolPaymentSetting",
    )
