from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base_model import BaseModel
from app.db.database import Base


class TimetablePublication(Base, BaseModel):
    __tablename__ = "timetable_publications"

    __table_args__ = (
        UniqueConstraint(
            "school_id",
            "academic_session_id",
            "term_id",
            name="uq_timetable_publication_school_session_term",
        ),
        Index(
            "ix_timetable_publications_school_id",
            "school_id",
        ),
    )

    school_id: Mapped[int] = mapped_column(
        ForeignKey("schools.id", ondelete="CASCADE"),
        nullable=False,
    )

    academic_session_id: Mapped[int] = mapped_column(
        ForeignKey("academic_sessions.id", ondelete="CASCADE"),
        nullable=False,
    )

    term_id: Mapped[int] = mapped_column(
        ForeignKey("terms.id", ondelete="CASCADE"),
        nullable=False,
    )

    publish_all_classes: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    published_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    published_by: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )


class TimetablePublicationClass(Base, BaseModel):
    __tablename__ = "timetable_publication_classes"

    __table_args__ = (
        UniqueConstraint(
            "publication_id",
            "classroom_id",
            name="uq_timetable_publication_class",
        ),
        Index(
            "ix_timetable_publication_classes_school_id",
            "school_id",
        ),
    )

    school_id: Mapped[int] = mapped_column(
        ForeignKey("schools.id", ondelete="CASCADE"),
        nullable=False,
    )

    publication_id: Mapped[int] = mapped_column(
        ForeignKey(
            "timetable_publications.id",
            ondelete="CASCADE",
        ),
        nullable=False,
    )

    classroom_id: Mapped[int] = mapped_column(
        ForeignKey("classrooms.id", ondelete="CASCADE"),
        nullable=False,
    )
