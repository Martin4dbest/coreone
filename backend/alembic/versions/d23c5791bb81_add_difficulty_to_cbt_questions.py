"""add difficulty to cbt_questions

Revision ID: d23c5791bb81
Revises:
Create Date: 2026-08-03
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "d23c5791bb81"
down_revision = "e3dbdaf5bd2f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "cbt_questions",
        sa.Column(
            "difficulty",
            sa.String(length=20),
            nullable=True,
            server_default="Medium",
        ),
    )

    op.execute(
        "UPDATE cbt_questions SET difficulty='Medium' WHERE difficulty IS NULL"
    )

    op.alter_column(
        "cbt_questions",
        "difficulty",
        nullable=False,
        server_default=None,
    )


def downgrade() -> None:
    op.drop_column("cbt_questions", "difficulty")
