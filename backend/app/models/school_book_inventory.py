from datetime import date

from sqlalchemy import Date, ForeignKey, Integer, Text, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_model import BaseModel
from app.db.database import Base
from app.db.mixins import SchoolMixin


class SchoolBookReceipt(Base, BaseModel, SchoolMixin):
    __tablename__ = "school_book_receipts"

    school_id: Mapped[int] = mapped_column(
        ForeignKey("schools.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    school_book_id: Mapped[int] = mapped_column(
        ForeignKey("school_books.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    quantity_received: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    date_received: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    supplier: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    reference_number: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    received_by: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )


class SchoolBookDistribution(Base, BaseModel, SchoolMixin):
    __tablename__ = "school_book_distributions"

    school_id: Mapped[int] = mapped_column(
        ForeignKey("schools.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    school_book_id: Mapped[int] = mapped_column(
        ForeignKey("school_books.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    classroom_id: Mapped[int] = mapped_column(
        ForeignKey("classrooms.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    quantity_issued: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    student_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    date_issued: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    issued_by: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    students = relationship(
        "SchoolBookDistributionStudent",
        back_populates="distribution",
        cascade="all, delete-orphan",
    )


class SchoolBookDistributionStudent(Base, BaseModel, SchoolMixin):
    __tablename__ = "school_book_distribution_students"

    school_id: Mapped[int] = mapped_column(
        ForeignKey("schools.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    distribution_id: Mapped[int] = mapped_column(
        ForeignKey(
            "school_book_distributions.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    student_id: Mapped[int] = mapped_column(
        ForeignKey("students.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    quantity_issued: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        server_default="1",
    )

    distribution = relationship(
        "SchoolBookDistribution",
        back_populates="students",
    )

    student = relationship(
        "Student",
    )
