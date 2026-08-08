from datetime import datetime

from sqlalchemy import (
    Boolean,
    ForeignKey,
    UniqueConstraint,
)
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)

from app.db.base_model import BaseModel
from app.db.database import Base
from app.db.mixins import SchoolMixin


class TeacherSubject(Base, BaseModel, SchoolMixin):
    __tablename__ = "teacher_subjects"

    __table_args__ = (
        UniqueConstraint(
            "school_id",
            "teacher_id",
            "classroom_id",
            "subject_id",
            "academic_session_id",
            name="uq_teacher_subject_assignment",
        ),
    )

    teacher_id: Mapped[int] = mapped_column(
        ForeignKey("teachers.id", ondelete="CASCADE"),
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

    academic_session_id: Mapped[int] = mapped_column(
        ForeignKey("academic_sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    assigned_by: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )

    assigned_at: Mapped[datetime] = mapped_column(
        default=datetime.utcnow,
        nullable=False,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    teacher = relationship(
        "Teacher",
        lazy="joined",
    )

    classroom = relationship(
        "Classroom",
        lazy="joined",
    )

    subject = relationship(
        "Subject",
        lazy="joined",
    )

    academic_session = relationship(
        "AcademicSession",
        lazy="joined",
    )

    assigned_user = relationship(
        "User",
        foreign_keys="TeacherSubject.assigned_by",
        lazy="joined",
    )

    school = relationship(
        "School",
    )