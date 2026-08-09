from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class BrowserActivity(Base):
    __tablename__ = "browser_activities"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
    )

    browser_link_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey(
            "browser_links.id",
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
