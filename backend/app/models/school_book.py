from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base
from app.db.base_model import BaseModel
from app.db.mixins import SchoolMixin


class SchoolBook(Base, BaseModel, SchoolMixin):
    __tablename__ = "school_books"

    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    author: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    isbn: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    category: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    subject_id: Mapped[int | None] = mapped_column(
        ForeignKey("subjects.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    quantity: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=1,
    )

    is_active: Mapped[bool] = mapped_column(
        default=True,
        nullable=False,
    )
