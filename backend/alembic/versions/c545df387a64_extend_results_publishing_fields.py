"""extend results publishing fields

Revision ID: c545df387a64
Revises: df5aded9e3dc
Create Date: 2026-07-16 17:58:39.233983

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c545df387a64"
down_revision: Union[str, Sequence[str], None] = "df5aded9e3dc"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "results",
        sa.Column("teacher_comment", sa.Text(), nullable=True),
    )

    op.add_column(
        "results",
        sa.Column("principal_comment", sa.Text(), nullable=True),
    )

    op.add_column(
        "results",
        sa.Column(
            "is_published",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
    )

    op.add_column(
        "results",
        sa.Column("published_at", sa.DateTime(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("results", "published_at")
    op.drop_column("results", "is_published")
    op.drop_column("results", "principal_comment")
    op.drop_column("results", "teacher_comment")
