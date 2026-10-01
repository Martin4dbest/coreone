from datetime import time

from sqlalchemy import Boolean, ForeignKey, String, Time
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_model import BaseModel
from app.db.database import Base


class TimetableEntry(Base, BaseModel):
    __tablename__ = "timetable_entries"

    school_id: Mapped[int] = mapped_column(
        ForeignKey("schools.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    academic_session_id: Mapped[int] = mapped_column(
        ForeignKey("academic_sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    term_id: Mapped[int] = mapped_column(
        ForeignKey("terms.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    classroom_id: Mapped[int] = mapped_column(
        ForeignKey("classrooms.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    subject_id: Mapped[int] = mapped_column(
        ForeignKey("subjects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    teacher_id: Mapped[int] = mapped_column(
        ForeignKey("teachers.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    day_of_week: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        index=True,
    )

    start_time: Mapped[time] = mapped_column(
        Time,
        nullable=False,
    )

    end_time: Mapped[time] = mapped_column(
        Time,
        nullable=False,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
        index=True,
    )

    school = relationship("School")
    academic_session = relationship("AcademicSession")
    term = relationship("Term")
    classroom = relationship("Classroom")
    subject = relationship("Subject")
    teacher = relationship("Teacher")
