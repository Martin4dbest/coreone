from datetime import date

from sqlalchemy import Date, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_model import BaseModel
from app.db.database import Base


class Staff(Base, BaseModel):
    __tablename__ = "staff"

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
    middle_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    last_name: Mapped[str] = mapped_column(String(100))

    gender: Mapped[str | None] = mapped_column(String(20), nullable=True)
    date_of_birth: Mapped[date | None] = mapped_column(Date, nullable=True)
    phone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    address: Mapped[str | None] = mapped_column(String(500), nullable=True)

    job_title: Mapped[str | None] = mapped_column(String(150), nullable=True)
    department: Mapped[str | None] = mapped_column(String(150), nullable=True)
    employment_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    date_employed: Mapped[date | None] = mapped_column(Date, nullable=True)

    qualification: Mapped[str | None] = mapped_column(String(255), nullable=True)

    emergency_contact_name: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )
    emergency_contact_relationship: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )
    emergency_contact_phone: Mapped[str | None] = mapped_column(
        String(30),
        nullable=True,
    )

    profile_photo: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    user = relationship(
        "User",
        back_populates="staff",
    )

    @property
    def email(self) -> str:
        return self.user.email if self.user else ""

    @property
    def is_active(self) -> bool:
        return self.user.is_active if self.user else False
