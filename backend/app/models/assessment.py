from datetime import datetime

from sqlalchemy import Boolean, DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_model import BaseModel
from app.db.database import Base
from app.db.mixins import ActiveMixin, SchoolMixin


class Assessment(Base, BaseModel, SchoolMixin, ActiveMixin):
    __tablename__ = "assessments"

    title: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    assessment_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    class_id: Mapped[int] = mapped_column(
        nullable=False,
    )

    teacher_id: Mapped[int] = mapped_column(
        nullable=False,
    )

    due_date: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    is_published: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    school = relationship("School")
