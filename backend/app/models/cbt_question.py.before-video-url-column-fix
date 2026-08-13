from sqlalchemy import Boolean
from sqlalchemy import ForeignKey
from sqlalchemy import Integer
from sqlalchemy import String
from sqlalchemy import Text
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column
from sqlalchemy.orm import relationship

from app.db.base_model import BaseModel
from app.db.database import Base


class CBTQuestion(Base, BaseModel):
    __tablename__ = "cbt_questions"

    exam_id: Mapped[int] = mapped_column(
        ForeignKey(
            "cbt_exams.id",
            ondelete="CASCADE",
        ),
        index=True,
    )

    question: Mapped[str] = mapped_column(
        Text,
    )

    image_url: Mapped[str | None] = mapped_column(
        String(500),
    )

    option_a: Mapped[str] = mapped_column(
        Text,
    )

    option_b: Mapped[str] = mapped_column(
        Text,
    )

    option_c: Mapped[str] = mapped_column(
        Text,
    )

    option_d: Mapped[str] = mapped_column(
        Text,
    )

    option_e: Mapped[str | None] = mapped_column(
        Text,
    )

    correct_answer: Mapped[str] = mapped_column(
        String(5),
    )

    explanation: Mapped[str | None] = mapped_column(
        Text,
    )

    marks: Mapped[int] = mapped_column(
        Integer,
        default=1,
    )

    difficulty: Mapped[str] = mapped_column(
        String(20),
        default="Medium",
    )

    randomize_options: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
    )

    exam = relationship(
        "CBTExam",
    )