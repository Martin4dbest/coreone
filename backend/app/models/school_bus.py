from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base
from app.db.base_model import BaseModel
from app.db.mixins import SchoolMixin


class SchoolBus(Base, BaseModel, SchoolMixin):
    __tablename__ = "school_buses"

    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    registration_number: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    driver_name: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    driver_phone: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    capacity: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=1,
    )

    is_active: Mapped[bool] = mapped_column(
        default=True,
        nullable=False,
    )
