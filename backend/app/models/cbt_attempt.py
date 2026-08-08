from datetime import datetime

from sqlalchemy import Boolean
from sqlalchemy import DateTime
from sqlalchemy import ForeignKey
from sqlalchemy import Float
from sqlalchemy import Integer
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column
from sqlalchemy.orm import relationship

from app.db.base_model import BaseModel
from app.db.database import Base


class CBTAttempt(Base, BaseModel):
    __tablename__ = "cbt_attempts"

    exam_id: Mapped[int] = mapped_column(
        ForeignKey(
            "cbt_exams.id",
            ondelete="CASCADE",
        ),
        index=True,
    )

    student_id: Mapped[int] = mapped_column(
        ForeignKey(
            "students.id",
            ondelete="CASCADE",
        ),
        index=True,
    )

    started_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )

    submitted_at: Mapped[datetime | None] = mapped_column(
        DateTime,
    )

    score: Mapped[int] = mapped_column(
        Integer,
        default=0,
    )

    total_marks: Mapped[int] = mapped_column(
        Integer,
        default=0,
    )

    percentage: Mapped[float] = mapped_column(
        Float,
        default=0,
    )

    passed: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
    )

    completed: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
    )

    exam = relationship("CBTExam")
    student = relationship("Student")