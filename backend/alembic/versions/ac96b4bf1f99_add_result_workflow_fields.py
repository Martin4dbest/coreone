"""add_result_workflow_fields

Revision ID: ac96b4bf1f99
Revises: aa5748094ae8
Create Date: 2026-07-17 22:58:27.670712
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "ac96b4bf1f99"
down_revision: Union[str, Sequence[str], None] = "aa5748094ae8"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "results",
        sa.Column(
            "status",
            sa.String(length=20),
            nullable=False,
            server_default="DRAFT",
        ),
    )
    op.alter_column("results", "status", server_default=None)
    op.add_column("results", sa.Column("entered_by", sa.Integer(), nullable=True))
    op.add_column("results", sa.Column("reviewed_by", sa.Integer(), nullable=True))
    op.add_column("results", sa.Column("published_by", sa.Integer(), nullable=True))
    op.drop_column("results", "published_at")
    op.drop_column("results", "is_published")


def downgrade() -> None:
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
        sa.Column("published_at", postgresql.TIMESTAMP(), nullable=True),
    )
    op.drop_column("results", "published_by")
    op.drop_column("results", "reviewed_by")
    op.drop_column("results", "entered_by")
    op.drop_column("results", "status")
