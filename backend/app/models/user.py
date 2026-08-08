from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_model import BaseModel
from app.db.database import Base


class User(Base, BaseModel):
    __tablename__ = "users"

    school_id: Mapped[int] = mapped_column(
        ForeignKey("schools.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    role_id: Mapped[int] = mapped_column(
        ForeignKey("roles.id"),
        nullable=False,
        index=True,
    )

    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
    )

    hashed_password: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
    )

    is_verified: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
    )

    must_change_password: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    last_login: Mapped[datetime | None] = mapped_column(
        DateTime,
    )

    school = relationship(
        "School",
    )

    role = relationship(
        "Role",
    )

    student = relationship(
        "Student",
        back_populates="user",
        uselist=False,
    )

    teacher = relationship(
        "Teacher",
        back_populates="user",
        uselist=False,
    )

    parent = relationship(
        "Parent",
        back_populates="user",
        uselist=False,
    )

    staff = relationship(
        "Staff",
        back_populates="user",
        uselist=False,
    )