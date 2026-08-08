from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_model import BaseModel
from app.db.database import Base
from app.db.mixins import SchoolMixin, ActiveMixin


class Setting(Base, BaseModel, SchoolMixin, ActiveMixin):
    __tablename__ = "settings"

    key: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    value: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    school = relationship("School")