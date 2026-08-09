"""add browser activity tracking

Revision ID: add_browser_activity
Revises: brows_links_ebook_access
"""

from alembic import op
import sqlalchemy as sa


revision = "add_browser_activity"
down_revision = "brows_links_ebook_access"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "browser_activities",
        sa.Column(
            "id",
            sa.Integer(),
            primary_key=True,
        ),
        sa.Column(
            "browser_link_id",
            sa.Integer(),
            sa.ForeignKey(
                "browser_links.id",
                ondelete="CASCADE",
            ),
            nullable=False,
        ),
        sa.Column(
            "user_id",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "school_id",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "activity_type",
            sa.String(20),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )

    op.create_index(
        "ix_browser_activities_browser_link_id",
        "browser_activities",
        ["browser_link_id"],
    )

    op.create_index(
        "ix_browser_activities_user_id",
        "browser_activities",
        ["user_id"],
    )

    op.create_index(
        "ix_browser_activities_school_id",
        "browser_activities",
        ["school_id"],
    )

    op.create_index(
        "ix_browser_activities_activity_type",
        "browser_activities",
        ["activity_type"],
    )

    op.create_index(
        "ix_browser_activities_created_at",
        "browser_activities",
        ["created_at"],
    )


def downgrade():
    op.drop_index(
        "ix_browser_activities_created_at",
        table_name="browser_activities",
    )

    op.drop_index(
        "ix_browser_activities_activity_type",
        table_name="browser_activities",
    )

    op.drop_index(
        "ix_browser_activities_school_id",
        table_name="browser_activities",
    )

    op.drop_index(
        "ix_browser_activities_user_id",
        table_name="browser_activities",
    )

    op.drop_index(
        "ix_browser_activities_browser_link_id",
        table_name="browser_activities",
    )

    op.drop_table("browser_activities")
