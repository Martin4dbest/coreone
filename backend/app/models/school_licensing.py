from sqlalchemy import ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base_model import BaseModel
from app.db.database import Base


class SchoolLicensing(Base, BaseModel):
    __tablename__ = "school_licensing"

    school_id: Mapped[int] = mapped_column(
        ForeignKey(
            "schools.id",
            ondelete="CASCADE",
        ),
        unique=True,
        nullable=False,
        index=True,
    )

    super_admin_price: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=5000,
    )

    admin_price: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=5000,
    )

    teacher_price: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=2000,
    )

    student_price: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=1000,
    )

    parent_price: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=500,
    )

    staff_price: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=1000,
    )
