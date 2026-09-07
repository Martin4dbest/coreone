from sqlalchemy import ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class YoutubeLearningStudent(Base):
    __tablename__ = "youtube_learning_students"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )

    youtube_learning_id: Mapped[int] = mapped_column(
        ForeignKey(
            "youtube_learning.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    student_id: Mapped[int] = mapped_column(
        ForeignKey(
            "students.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    youtube_learning = relationship(
        "YoutubeLearning",
        back_populates="student_targets",
    )

    student = relationship(
        "Student",
    )

    __table_args__ = (
        UniqueConstraint(
            "youtube_learning_id",
            "student_id",
            name="uq_youtube_learning_student",
        ),
    )
