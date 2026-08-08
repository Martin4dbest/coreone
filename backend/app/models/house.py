from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_model import BaseModel
from app.db.database import Base
from app.db.mixins import ActiveMixin, SchoolMixin


class House(Base, BaseModel, SchoolMixin, ActiveMixin):
    __tablename__ = "houses"

    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    color: Mapped[str | None] = mapped_column(
        String(30),
    )

    school = relationship("School")