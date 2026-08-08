from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_model import BaseModel
from app.db.database import Base
from app.db.mixins import SchoolMixin


class Teacher(Base, BaseModel, SchoolMixin):
    __tablename__ = "teachers"

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )

    employee_number: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
        index=True,
    )

    first_name: Mapped[str] = mapped_column(String(100))
    last_name: Mapped[str] = mapped_column(String(100))

    user = relationship(
        "User",
        back_populates="teacher",
    )

    teacher_subjects = relationship(
        "TeacherSubject",
        back_populates="teacher",
        cascade="all, delete-orphan",
    )

    class_teacher_of = relationship(
        "Classroom",
        foreign_keys="Classroom.class_teacher_id",
        back_populates="class_teacher",
    )

    @property
    def assignments(self):
        return self.teacher_subjects