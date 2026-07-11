from sqlalchemy import Float, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_model import BaseModel
from app.db.database import Base
from app.db.mixins import ActiveMixin, SchoolMixin


class Result(Base, BaseModel, SchoolMixin, ActiveMixin):
    __tablename__ = "results"

    student_id: Mapped[int] = mapped_column(
        nullable=False,
    )

    class_id: Mapped[int] = mapped_column(
        nullable=False,
    )

    subject_id: Mapped[int] = mapped_column(
        nullable=False,
    )

    term_id: Mapped[int] = mapped_column(
        nullable=False,
    )

    academic_session_id: Mapped[int] = mapped_column(
        nullable=False,
    )

    ca_score: Mapped[float] = mapped_column(
        Float,
        default=0,
        nullable=False,
    )

    exam_score: Mapped[float] = mapped_column(
        Float,
        default=0,
        nullable=False,
    )

    total_score: Mapped[float] = mapped_column(
        Float,
        default=0,
        nullable=False,
    )

    grade: Mapped[str | None] = mapped_column(
        String(5),
        nullable=True,
    )

    remark: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    school = relationship("School")
