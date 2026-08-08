from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_model import BaseModel
from app.db.database import Base
from app.db.mixins import SchoolMixin


class AcademicSession(Base, BaseModel, SchoolMixin):
    __tablename__ = "academic_sessions"

    name: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )

    is_current: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
    )

    school = relationship("School")