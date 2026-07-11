from datetime import datetime

from sqlalchemy import DateTime, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_model import BaseModel
from app.db.database import Base
from app.db.mixins import SchoolMixin


class Visitor(Base, BaseModel, SchoolMixin):
    __tablename__ = "visitors"

    full_name: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    phone: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
    )

    purpose: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    person_to_visit: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
    )

    check_in_time: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    check_out_time: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    school = relationship("School")
