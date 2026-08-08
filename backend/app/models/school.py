from __future__ import annotations

from enum import Enum

from sqlalchemy import Boolean, Enum as SQLEnum, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base_model import BaseModel
from app.db.database import Base


class SubscriptionStatus(str, Enum):
    ACTIVE = "ACTIVE"
    SUSPENDED = "SUSPENDED"
    EXPIRED = "EXPIRED"


class School(Base, BaseModel):
    __tablename__ = "schools"

    name: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    school_code: Mapped[str] = mapped_column(
        String(20),
        unique=True,
        nullable=False,
        index=True,
    )

    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
    )

    phone: Mapped[str] = mapped_column(
        String(30),
    )

    address: Mapped[str] = mapped_column(
        String(255),
    )

    city: Mapped[str] = mapped_column(
        String(100),
    )

    state: Mapped[str] = mapped_column(
        String(100),
    )

    country: Mapped[str] = mapped_column(
        String(100),
        default="Nigeria",
    )

    logo: Mapped[str | None] = mapped_column(
        String(500),
    )

    primary_color: Mapped[str] = mapped_column(
        String(20),
        default="#2563EB",
    )

    secondary_color: Mapped[str] = mapped_column(
        String(20),
        default="#1E293B",
    )

    website: Mapped[str | None] = mapped_column(
        String(255),
    )

    # -----------------------------
    # Tenant Management
    # -----------------------------

    domain: Mapped[str | None] = mapped_column(
        String(255),
        unique=True,
        index=True,
    )

    custom_domain: Mapped[str | None] = mapped_column(
        String(255),
        unique=True,
        index=True,
    )

    domain_verified: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
    )

    tenant_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
    )

    subscription_status: Mapped[SubscriptionStatus] = mapped_column(
        SQLEnum(SubscriptionStatus),
        default=SubscriptionStatus.ACTIVE,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
    )