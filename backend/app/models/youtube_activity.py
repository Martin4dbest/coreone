from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class YoutubeActivity(Base):
    __tablename__ = "youtube_activities"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
    )

    youtube_learning_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey(
            "youtube_learning.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    user_id: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        index=True,
    )

    school_id: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        index=True,
    )

    activity_type: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        server_default=func.now(),
        index=True,
    )
