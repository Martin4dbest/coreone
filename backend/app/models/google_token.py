from sqlalchemy import ForeignKey
from sqlalchemy import String
from sqlalchemy import Text
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column
from sqlalchemy.orm import relationship

from app.db.base_model import BaseModel
from app.db.database import Base
from app.db.mixins import ActiveMixin
from app.db.mixins import SchoolMixin


class GoogleToken(
    Base,
    BaseModel,
    SchoolMixin,
    ActiveMixin,
):
    __tablename__ = "google_tokens"

    provider: Mapped[str] = mapped_column(
        String(50),
        default="google_forms",
    )

    email: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    access_token: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    refresh_token: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    token_type: Mapped[str] = mapped_column(
        String(50),
        default="Bearer",
    )

    expires_in: Mapped[int] = mapped_column()

    scope: Mapped[str | None] = mapped_column(
        Text,
    )

    created_by: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
    )

    school = relationship("School")
    user = relationship("User")