"""add must_change_password to users

Revision ID: a5347ab26e16
Revises: 8545d1e8209f
Create Date: 2026-07-27

"""

from alembic import op
import sqlalchemy as sa


revision = "a5347ab26e16"
down_revision = "8545d1e8209f"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "users",
        sa.Column(
            "must_change_password",
            sa.Boolean(),
            nullable=False,
            server_default="true",
        ),
    )


def downgrade():
    op.drop_column(
        "users",
        "must_change_password",
    )
