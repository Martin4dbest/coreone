from __future__ import annotations

from sqlalchemy import Boolean, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base_model import BaseModel
from app.db.database import Base


class SchoolBranding(Base, BaseModel):
    __tablename__ = "school_branding"

    __table_args__ = (
        UniqueConstraint(
            "school_id",
            name="uq_school_branding_school_id",
        ),
    )

    school_id: Mapped[int] = mapped_column(
        ForeignKey(
            "schools.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    logo_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    app_icon_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    splash_image_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    primary_color: Mapped[str] = mapped_column(
        String(20),
        default="#2563EB",
        nullable=False,
    )

    secondary_color: Mapped[str] = mapped_column(
        String(20),
        default="#1E293B",
        nullable=False,
    )

    accent_color: Mapped[str] = mapped_column(
        String(20),
        default="#F43F5E",
        nullable=False,
    )

    motto: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    login_title: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    login_message: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )
