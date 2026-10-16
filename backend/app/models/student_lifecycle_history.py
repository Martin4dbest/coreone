from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_model import BaseModel
from app.db.database import Base
from app.db.mixins import SchoolMixin


class StudentLifecycleHistory(Base, BaseModel, SchoolMixin):
    __tablename__ = "student_lifecycle_history"

    student_id: Mapped[int] = mapped_column(
        ForeignKey("students.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    action: Mapped[str] = mapped_column(String(40), nullable=False)
    previous_classroom_id: Mapped[int | None] = mapped_column(
        ForeignKey("classrooms.id", ondelete="SET NULL"),
        nullable=True,
    )
    new_classroom_id: Mapped[int | None] = mapped_column(
        ForeignKey("classrooms.id", ondelete="SET NULL"),
        nullable=True,
    )
    previous_session_id: Mapped[int | None] = mapped_column(
        ForeignKey("academic_sessions.id", ondelete="SET NULL"),
        nullable=True,
    )
    new_session_id: Mapped[int | None] = mapped_column(
        ForeignKey("academic_sessions.id", ondelete="SET NULL"),
        nullable=True,
    )
    previous_status: Mapped[str | None] = mapped_column(String(30))
    new_status: Mapped[str | None] = mapped_column(String(30))
    performed_by: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )
    notes: Mapped[str | None] = mapped_column(Text)

    student = relationship("Student")
    performed_by_user = relationship("User")
