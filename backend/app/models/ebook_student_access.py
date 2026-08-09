from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class EbookStudentAccess(Base):
    __tablename__ = "ebook_student_access"

    __table_args__ = (
        UniqueConstraint(
            "ebook_id",
            "student_id",
            name="uq_ebook_student_access_ebook_student",
        ),
    )

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
    )

    ebook_id: Mapped[int] = mapped_column(
        ForeignKey(
            "ebooks.id",
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

    school_id: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        index=True,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default="true",
    )

    granted_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )

    granted_by: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    ebook = relationship(
        "Ebook",
        foreign_keys=[ebook_id],
    )

    student = relationship(
        "Student",
        foreign_keys=[student_id],
    )
