from sqlalchemy import Boolean, Integer, String, Text
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
        Integer,
        nullable=False,
    )

    subject_id: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
        index=True,
    )

    classroom_id: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
        index=True,
    )

    cover_image_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    file_name: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    file_size: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    file_type: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    featured: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default="false",
    )

    # Controls whether the ebook is visible to students.
    # This is separate from is_active, which controls archive/restore.
    is_published: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default="false",
    )

    download_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default="0",
    )

    view_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default="0",
    )

    school = relationship("School")
