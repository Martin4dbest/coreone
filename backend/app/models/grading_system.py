from sqlalchemy import Float, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_model import BaseModel
from app.db.database import Base
from app.db.mixins import ActiveMixin, SchoolMixin


class GradingSystem(Base, BaseModel, SchoolMixin, ActiveMixin):
    __tablename__ = "grading_systems"

    grade: Mapped[str] = mapped_column(
        String(5),
        nullable=False,
    )

    minimum_score: Mapped[float] = mapped_column(Float)

    maximum_score: Mapped[float] = mapped_column(Float)

    remark: Mapped[str] = mapped_column(
        String(100),
    )

    school = relationship("School")
