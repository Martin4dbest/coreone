from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class StudentPartnerSchool(Base):
    __tablename__ = "student_partner_schools"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )

    student_id: Mapped[int] = mapped_column(
        ForeignKey("students.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    partner_school_id: Mapped[int] = mapped_column(
        ForeignKey("partner_schools.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    __table_args__ = (
        UniqueConstraint(
            "student_id",
            "partner_school_id",
            name="uq_student_partner_school",
        ),
    )

    student = relationship(
        "Student",
        back_populates="partner_school_links",
    )

    partner_school = relationship(
        "PartnerSchool",
        back_populates="student_links",
    )
