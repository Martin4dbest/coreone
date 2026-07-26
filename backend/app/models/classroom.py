from datetime import datetime

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_model import BaseModel
from app.db.database import Base
from app.db.mixins import ActiveMixin, SchoolMixin


class Classroom(Base, BaseModel, SchoolMixin, ActiveMixin):
    __tablename__ = "classrooms"

    level_id: Mapped[int] = mapped_column(
        ForeignKey("levels.id", ondelete="CASCADE"),
        nullable=False,
    )

    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    class_teacher_id: Mapped[int | None] = mapped_column(
        ForeignKey("teachers.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    class_teacher_assigned_by: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    class_teacher_assigned_at: Mapped[datetime | None] = mapped_column(
        nullable=True,
    )

    level = relationship("Level")

    class_teacher = relationship(
        "Teacher",
        foreign_keys="Classroom.class_teacher_id",
        back_populates="class_teacher_of",
        lazy="joined",
    )

    assigned_by = relationship(
        "User",
        foreign_keys="Classroom.class_teacher_assigned_by",
    )

    school = relationship("School")

    teacher_subjects = relationship(
        "TeacherSubject",
        back_populates="classroom",
    )
