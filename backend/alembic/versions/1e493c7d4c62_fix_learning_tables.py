"""fix_learning_tables

Revision ID: 1e493c7d4c62
Revises: 1a6bbab826f9
Create Date: 2026-07-31
"""

from alembic import op
import sqlalchemy as sa

revision = "1e493c7d4c62"
down_revision = "1a6bbab826f9"
branch_labels = None
depends_on = None


def upgrade():

    op.create_table(
        "ebooks",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("description", sa.Text()),
        sa.Column("file_url", sa.String(500), nullable=False),
        sa.Column("cover_image", sa.String(500)),
        sa.Column("created_by", sa.Integer(), nullable=False),
        sa.Column("school_id", sa.Integer(), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true")),
        sa.Column("uuid", sa.String(36)),
        sa.Column("created_at", sa.DateTime()),
        sa.Column("updated_at", sa.DateTime()),
    )

    op.create_table(
        "browser_links",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("url", sa.String(500), nullable=False),
        sa.Column("description", sa.Text()),
        sa.Column("category", sa.String(100)),
        sa.Column("created_by", sa.Integer(), nullable=False),
        sa.Column("school_id", sa.Integer(), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true")),
        sa.Column("uuid", sa.String(36)),
        sa.Column("created_at", sa.DateTime()),
        sa.Column("updated_at", sa.DateTime()),
    )

    op.create_table(
        "youtube_learning",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("youtube_url", sa.String(500), nullable=False),
        sa.Column("description", sa.Text()),
        sa.Column("thumbnail_url", sa.String(500)),
        sa.Column("created_by", sa.Integer(), nullable=False),
        sa.Column("school_id", sa.Integer(), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true")),
        sa.Column("uuid", sa.String(36)),
        sa.Column("created_at", sa.DateTime()),
        sa.Column("updated_at", sa.DateTime()),
    )


def downgrade():
    op.drop_table("youtube_learning")
    op.drop_table("browser_links")
    op.drop_table("ebooks")
