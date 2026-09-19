from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, Float, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_model import BaseModel
from app.db.database import Base


class StaffAttendance(Base, BaseModel):
    __tablename__ = "staff_attendance"

    __table_args__ = (
        UniqueConstraint(
            "staff_id",
            "attendance_date",
            name="uq_staff_attendance_date",
        ),
    )

    staff_id: Mapped[int] = mapped_column(
        ForeignKey("staff.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    school_id: Mapped[int] = mapped_column(
        ForeignKey("schools.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    attendance_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        index=True,
    )

    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )

    remarks: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    check_in_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    check_in_latitude: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    check_in_longitude: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    check_in_accuracy: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    check_in_distance_meters: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    check_in_mocked: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )

    staff = relationship("Staff")
    school = relationship("School")
