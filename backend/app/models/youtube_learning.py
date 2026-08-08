from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_model import BaseModel
from app.db.database import Base
from app.db.mixins import ActiveMixin, SchoolMixin


class YoutubeLearning(Base, BaseModel, SchoolMixin, ActiveMixin):
    __tablename__ = "youtube_learning"

    title: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    video_url: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    subject: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    class_id: Mapped[int | None] = mapped_column(
        nullable=True,
    )

    uploaded_by: Mapped[int] = mapped_column(
        nullable=False,
    )

    school = relationship("School")