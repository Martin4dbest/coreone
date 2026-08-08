from datetime import datetime

from sqlalchemy import DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_model import BaseModel
from app.db.database import Base
from app.db.mixins import ActiveMixin, SchoolMixin


class Event(Base, BaseModel, SchoolMixin, ActiveMixin):
    __tablename__ = "events"

    title: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    event_date: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
    )

    location: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
    )

    school = relationship("School")