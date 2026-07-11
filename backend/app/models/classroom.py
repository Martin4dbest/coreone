from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_model import BaseModel
from app.db.database import Base
from app.db.mixins import ActiveMixin, SchoolMixin


class Classroom(Base, BaseModel, SchoolMixin, ActiveMixin):
    __tablename__ = "classrooms"

    level_id: Mapped[int] = mapped_column(
        ForeignKey("levels.id", ondelete="CASCADE"),
        nullable=False,
    )

    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    level = relationship("Level")
    school = relationship("School")
