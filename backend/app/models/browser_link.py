from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_model import BaseModel
from app.db.database import Base
from app.db.mixins import ActiveMixin, SchoolMixin


class BrowserLink(Base, BaseModel, SchoolMixin, ActiveMixin):
    __tablename__ = "browser_links"

    title: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    url: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    category: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    created_by: Mapped[int] = mapped_column(
        nullable=False,
    )

    school = relationship("School")