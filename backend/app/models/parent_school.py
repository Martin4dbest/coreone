from datetime import datetime

from sqlalchemy import (
    DateTime,
    ForeignKey,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class ParentSchool(Base):
    __tablename__ = "parent_schools"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )

    parent_id: Mapped[int] = mapped_column(
        ForeignKey(
            "parents.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    school_id: Mapped[int] = mapped_column(
        ForeignKey(
            "schools.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    __table_args__ = (
        UniqueConstraint(
            "parent_id",
            "school_id",
            name="uq_parent_school",
        ),
    )

    parent = relationship(
        "Parent",
        back_populates="school_memberships",
    )

    school = relationship(
        "School",
    )
