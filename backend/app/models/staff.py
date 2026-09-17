from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_model import BaseModel
from app.db.database import Base


class Staff(Base, BaseModel):
    __tablename__ = "staff"

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )

    employee_number: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
        index=True,
    )

    first_name: Mapped[str] = mapped_column(String(100))
    last_name: Mapped[str] = mapped_column(String(100))

    user = relationship(
        "User",
        back_populates="staff",
    )

    @property
    def email(self) -> str:
        return self.user.email if self.user else ""

    @property
    def is_active(self) -> bool:
        return self.user.is_active if self.user else False
