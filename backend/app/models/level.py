from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_model import BaseModel
from app.db.database import Base
from app.db.mixins import SchoolMixin


class Level(Base, BaseModel, SchoolMixin):
    __tablename__ = "levels"

    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    school = relationship("School")
