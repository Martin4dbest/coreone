from __future__ import annotations

from decimal import Decimal

from sqlalchemy import ForeignKey, Numeric, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_model import BaseModel
from app.db.database import Base
from app.db.mixins import ActiveMixin, SchoolMixin


class FeeStructure(Base, BaseModel, SchoolMixin, ActiveMixin):
    """
    Defines the fees payable for a school, academic session,
    term and optionally a specific classroom.
    """

    __tablename__ = "fee_structures"

    __table_args__ = (
        UniqueConstraint(
            "school_id",
            "academic_session_id",
            "term_id",
            "classroom_id",
            "name",
            name="uq_fee_structures_scope_name",
        ),
    )

    academic_session_id: Mapped[int] = mapped_column(
        ForeignKey(
            "academic_sessions.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    term_id: Mapped[int] = mapped_column(
        ForeignKey(
            "terms.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    classroom_id: Mapped[int | None] = mapped_column(
        ForeignKey(
            "classrooms.id",
            ondelete="SET NULL",
        ),
        nullable=True,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    items = relationship(
        "FeeStructureItem",
        back_populates="fee_structure",
        cascade="all, delete-orphan",
    )

    academic_session = relationship(
        "AcademicSession",
    )

    term = relationship(
        "Term",
    )

    classroom = relationship(
        "Classroom",
    )


class FeeStructureItem(Base, BaseModel):
    """
    Individual fee line within a fee structure.

    Example:
        Tuition             80000
        Examination          5000
        ICT                  5000
    """

    __tablename__ = "fee_structure_items"

    fee_structure_id: Mapped[int] = mapped_column(
        ForeignKey(
            "fee_structures.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )

    fee_structure = relationship(
        "FeeStructure",
        back_populates="items",
    )
