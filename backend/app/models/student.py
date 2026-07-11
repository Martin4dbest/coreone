from __future__ import annotations

from datetime import date

from sqlalchemy import Date, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_model import BaseModel
from app.db.database import Base
from app.db.mixins import ActiveMixin, SchoolMixin


class Student(Base, BaseModel, SchoolMixin, ActiveMixin):
    __tablename__ = "students"

    __table_args__ = (
        UniqueConstraint(
            "school_id",
            "admission_number",
            name="uq_students_school_admission_number",
        ),
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )

    classroom_id: Mapped[int | None] = mapped_column(
        ForeignKey("classrooms.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    admission_number: Mapped[str] = mapped_column(
        String(50),
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

    school = relationship(
        "School",
    )

    classroom = relationship(
        "Classroom",
    )
