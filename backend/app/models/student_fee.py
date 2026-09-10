from __future__ import annotations

from decimal import Decimal

from sqlalchemy import ForeignKey, Numeric, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_model import BaseModel
from app.db.database import Base
from app.db.mixins import SchoolMixin


class StudentFee(Base, BaseModel, SchoolMixin):
    """
    Represents the actual fee obligation assigned to one student.

    The amounts are stored as a snapshot so that changing a future
    fee structure does not alter an already-issued student invoice.
    """

    __tablename__ = "student_fees"

    __table_args__ = (
        UniqueConstraint(
            "school_id",
            "student_id",
            "fee_structure_id",
            name="uq_student_fees_student_structure",
        ),
    )

    student_id: Mapped[int] = mapped_column(
        ForeignKey(
            "students.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    fee_structure_id: Mapped[int] = mapped_column(
        ForeignKey(
            "fee_structures.id",
            ondelete="RESTRICT",
        ),
        nullable=False,
        index=True,
    )

    invoice_number: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        nullable=False,
        index=True,
    )

    amount_due: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )

    amount_paid: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
        default=Decimal("0.00"),
    )

    adjustment_amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
        default=Decimal("0.00"),
    )

    adjustment_reason: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="UNPAID",
        index=True,
    )

    student = relationship(
        "Student",
    )

    fee_structure = relationship(
        "FeeStructure",
    )

    payments = relationship(
        "Payment",
        back_populates="student_fee",
        cascade="all, delete-orphan",
    )
