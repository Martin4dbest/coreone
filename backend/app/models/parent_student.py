from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class ParentStudent(Base):
    __tablename__ = "parent_students"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )

    parent_id: Mapped[int] = mapped_column(
        ForeignKey("parents.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    student_id: Mapped[int] = mapped_column(
        ForeignKey("students.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    relationship_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="Parent/Guardian",
        server_default="Parent/Guardian",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    __table_args__ = (
        UniqueConstraint(
            "parent_id",
            "student_id",
            name="uq_parent_student",
        ),
    )

    parent = relationship(
        "Parent",
        back_populates="student_links",
    )

    student = relationship(
        "Student",
        back_populates="parent_links",
    )
