from __future__ import annotations

from datetime import date

from sqlalchemy import Date, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_model import BaseModel
from app.db.database import Base


class Student(Base, BaseModel):
    __tablename__ = "students"

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )

    admission_number: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
        index=True,
    )

    first_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    last_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    middle_name: Mapped[str | None] = mapped_column(
        String(100),
    )

    gender: Mapped[str] = mapped_column(
        String(20),
    )

    date_of_birth: Mapped[date] = mapped_column(
        Date,
    )

    passport: Mapped[str | None] = mapped_column(
        String(255),
    )

    user = relationship(
        "User",
        back_populates="student",
    )
