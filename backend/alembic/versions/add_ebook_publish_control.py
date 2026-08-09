"""add ebook publish control

Revision ID: add_ebook_publish_control
Revises: b7c9d2e4f111
"""

from alembic import op
import sqlalchemy as sa


revision = "add_ebook_publish_control"
down_revision = "b7c9d2e4f111"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "ebooks",
        sa.Column(
            "is_published",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )


def downgrade():
    op.drop_column("ebooks", "is_published")
