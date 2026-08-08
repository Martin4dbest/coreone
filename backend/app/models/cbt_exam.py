from enum import Enum

from sqlalchemy import Enum as SQLEnum
from sqlalchemy import ForeignKey
from sqlalchemy import Integer
from sqlalchemy import String
from sqlalchemy import Text
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column
from sqlalchemy.orm import relationship

from app.db.base_model import BaseModel
from app.db.database import Base
from app.db.mixins import ActiveMixin
from app.db.mixins import SchoolMixin


class QuestionSource(str, Enum):
    INTERNAL = "INTERNAL"
    API = "API"
    IMPORT = "IMPORT"
    AI = "AI"


class CBTExam(
    Base,
    BaseModel,
    SchoolMixin,
    ActiveMixin,
):
    __tablename__ = "cbt_exams"

    title: Mapped[str] = mapped_column(
        String(200),
    )

    description: Mapped[str | None] = mapped_column(
        Text,
    )

    subject_id: Mapped[int] = mapped_column(
        ForeignKey("subjects.id"),
    )

    class_id: Mapped[int] = mapped_column(
        ForeignKey("classrooms.id"),
    )

    duration_minutes: Mapped[int] = mapped_column(
        Integer,
        default=60,
    )

    total_questions: Mapped[int] = mapped_column(
        Integer,
        default=50,
    )

    total_marks: Mapped[int] = mapped_column(
        Integer,
        default=50,
    )

    pass_mark: Mapped[int] = mapped_column(
        Integer,
        default=50,
    )

    randomize_questions: Mapped[bool] = mapped_column(
        default=True,
    )

    randomize_options: Mapped[bool] = mapped_column(
        default=True,
    )

    allow_resume: Mapped[bool] = mapped_column(
        default=True,
    )

    show_result_immediately: Mapped[bool] = mapped_column(
        default=False,
    )

    negative_marking: Mapped[bool] = mapped_column(
        default=False,
    )

    negative_mark: Mapped[float] = mapped_column(
        default=0.0,
    )

    source_type: Mapped[QuestionSource] = mapped_column(
        SQLEnum(QuestionSource),
        default=QuestionSource.INTERNAL,
    )

    provider_name: Mapped[str | None] = mapped_column(
        String(100),
    )

    api_endpoint: Mapped[str | None] = mapped_column(
        String(500),
    )

    api_key: Mapped[str | None] = mapped_column(
        String(500),
    )

    import_file: Mapped[str | None] = mapped_column(
        String(500),
    )

    created_by: Mapped[int] = mapped_column()

    school = relationship("School")

    subject = relationship("Subject")

    classroom = relationship("Classroom")

    questions = relationship(
        "CBTQuestion",
        back_populates="exam",
        cascade="all, delete-orphan",
    )