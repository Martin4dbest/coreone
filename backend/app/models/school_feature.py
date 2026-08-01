from sqlalchemy import Boolean, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_model import BaseModel
from app.db.database import Base


class SchoolFeature(Base, BaseModel):
    __tablename__ = "school_features"

    __table_args__ = (
        UniqueConstraint(
            "school_id",
            "feature_key",
            name="uq_school_feature",
        ),
    )

    school_id: Mapped[int] = mapped_column(
        ForeignKey("schools.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    feature_key: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
    )

    enabled: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    school = relationship("School")
