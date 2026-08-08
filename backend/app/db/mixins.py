from sqlalchemy import Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column


class SchoolMixin:
    """
    Every school-owned table inherits this.
    """

    school_id: Mapped[int] = mapped_column(
        ForeignKey("schools.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )


class ActiveMixin:
    """
    Adds active/inactive support.
    """

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
    )