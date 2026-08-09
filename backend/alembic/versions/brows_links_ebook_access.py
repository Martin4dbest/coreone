"""create browser links table after ebook access

Revision ID: brows_links_ebook_access
Revises: add_ebook_student_access
"""

from alembic import op
import sqlalchemy as sa


revision = "brows_links_ebook_access"
down_revision = "add_ebook_student_access"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "browser_links",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("url", sa.String(500), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("category", sa.String(100), nullable=True),
        sa.Column("created_by", sa.Integer(), nullable=False),
        sa.Column("school_id", sa.Integer(), nullable=False),
        sa.Column(
            "is_active",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("true"),
        ),
        sa.Column("uuid", sa.String(36), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
    )


def downgrade():
    op.drop_table("browser_links")
