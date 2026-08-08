"""add ebook activity created at default

Revision ID: d88b25d7ef16
Revises: 7a4f2d91c8e3
Create Date: 2026-08-07 20:55:30.676220

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "d88b25d7ef16"
down_revision: Union[str, Sequence[str], None] = "7a4f2d91c8e3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    op.alter_column(
        "ebook_activities",
        "created_at",
        existing_type=sa.DateTime(),
        nullable=False,
        server_default=sa.text("CURRENT_TIMESTAMP"),
    )


def downgrade() -> None:
    """Downgrade schema."""

    op.alter_column(
        "ebook_activities",
        "created_at",
        existing_type=sa.DateTime(),
        nullable=False,
        server_default=None,
    )
