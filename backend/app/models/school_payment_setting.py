from typing import Optional

from sqlalchemy import Boolean, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base
from app.db.base_model import BaseModel


class SchoolPaymentSetting(Base, BaseModel):
    __tablename__ = "school_payment_settings"

    school_id: Mapped[int] = mapped_column(
        ForeignKey("schools.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )

    provider: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="paystack",
    )

    is_enabled: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )

    public_key: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
    )

    encrypted_secret_key: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )

    encrypted_webhook_secret: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )

    currency: Mapped[str] = mapped_column(
        String(10),
        nullable=False,
        default="NGN",
    )

    school = relationship("School")
