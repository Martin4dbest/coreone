"""add active status to students levels and classrooms

Revision ID: dac227d75bff
Revises: ca243e09018b
Create Date: 2026-07-11 18:44:08.480935

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "dac227d75bff"
down_revision: Union[str, Sequence[str], None] = "ca243e09018b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    op.add_column(
        "classrooms",
        sa.Column(
            "is_active",
            sa.Boolean(),
            nullable=False,
            server_default=sa.true(),
        ),
    )

    op.add_column(
        "levels",
        sa.Column(
            "is_active",
            sa.Boolean(),
            nullable=False,
            server_default=sa.true(),
        ),
    )

    op.add_column(
        "students",
        sa.Column(
            "is_active",
            sa.Boolean(),
            nullable=False,
            server_default=sa.true(),
        ),
    )

    op.alter_column(
        "classrooms",
        "is_active",
        server_default=None,
    )

    op.alter_column(
        "levels",
        "is_active",
        server_default=None,
    )

    op.alter_column(
        "students",
        "is_active",
        server_default=None,
    )


def downgrade() -> None:
    """Downgrade schema."""

    op.drop_column("students", "is_active")
    op.drop_column("levels", "is_active")
    op.drop_column("classrooms", "is_active")
