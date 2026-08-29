from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_model import BaseModel
from app.db.database import Base


class Parent(Base, BaseModel):
    __tablename__ = "parents"

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )

    first_name: Mapped[str] = mapped_column(String(100))
    last_name: Mapped[str] = mapped_column(String(100))

    phone: Mapped[str] = mapped_column(String(30))

    user = relationship(
        "User",
        back_populates="parent",
    )

    student_links = relationship(
        "ParentStudent",
        back_populates="parent",
        cascade="all, delete-orphan",
    )

    school_memberships = relationship(
        "ParentSchool",
        back_populates="parent",
        cascade="all, delete-orphan",
    )
