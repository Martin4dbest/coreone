from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_model import BaseModel
from app.db.database import Base
from app.db.mixins import ActiveMixin, SchoolMixin


class Ebook(Base, BaseModel, SchoolMixin, ActiveMixin):
    __tablename__ = "ebooks"

    title: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    author: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    file_url: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
    )

    category: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    uploaded_by: Mapped[int] = mapped_column(
        nullable=False,
    )

    school = relationship("School")
