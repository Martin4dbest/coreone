from sqlalchemy import Boolean
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


class CBTProvider(
    Base,
    BaseModel,
    SchoolMixin,
    ActiveMixin,
):
    __tablename__ = "cbt_providers"

    provider: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
    )

    display_name: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    enabled: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
    )

    oauth_client_id: Mapped[str | None] = mapped_column(
        Text,
    )

    oauth_client_secret: Mapped[str | None] = mapped_column(
        Text,
    )

    refresh_token: Mapped[str | None] = mapped_column(
        Text,
    )

    api_key: Mapped[str | None] = mapped_column(
        Text,
    )

    api_url: Mapped[str | None] = mapped_column(
        String(500),
    )

    drive_folder_id: Mapped[str | None] = mapped_column(
        String(255),
    )

    sync_results: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
    )

    auto_import: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
    )

    auto_export: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
    )

    created_by: Mapped[int | None] = mapped_column(
        ForeignKey("users.id")
    )

    school = relationship("School")