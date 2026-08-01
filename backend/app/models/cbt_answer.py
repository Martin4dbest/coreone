from sqlalchemy import Boolean
from sqlalchemy import ForeignKey
from sqlalchemy import Integer
from sqlalchemy import String
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column
from sqlalchemy.orm import relationship

from app.db.base_model import BaseModel
from app.db.database import Base


class CBTAnswer(Base, BaseModel):
    __tablename__ = "cbt_answers"

    attempt_id: Mapped[int] = mapped_column(
        ForeignKey(
            "cbt_attempts.id",
            ondelete="CASCADE",
        ),
        index=True,
    )

    question_id: Mapped[int] = mapped_column(
        ForeignKey(
            "cbt_questions.id",
            ondelete="CASCADE",
        ),
        index=True,
    )

    selected_answer: Mapped[str | None] = mapped_column(
        String(5),
    )

    is_correct: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
    )

    marks_awarded: Mapped[int] = mapped_column(
        Integer,
        default=0,
    )

    time_spent_seconds: Mapped[int] = mapped_column(
        Integer,
        default=0,
    )

    flagged: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
    )

    attempt = relationship("CBTAttempt")
    question = relationship("CBTQuestion")
