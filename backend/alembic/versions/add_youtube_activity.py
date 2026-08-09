"""add youtube activity tracking

Revision ID: add_youtube_activity
Revises: add_browser_activity
"""

from alembic import op
import sqlalchemy as sa


revision = "add_youtube_activity"
down_revision = "add_browser_activity"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "youtube_activities",
        sa.Column(
            "id",
            sa.Integer(),
            primary_key=True,
        ),
        sa.Column(
            "youtube_learning_id",
            sa.Integer(),
            sa.ForeignKey(
                "youtube_learning.id",
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
        "ix_youtube_activities_youtube_learning_id",
        "youtube_activities",
        ["youtube_learning_id"],
    )

    op.create_index(
        "ix_youtube_activities_user_id",
        "youtube_activities",
        ["user_id"],
    )

    op.create_index(
        "ix_youtube_activities_school_id",
        "youtube_activities",
        ["school_id"],
    )

    op.create_index(
        "ix_youtube_activities_activity_type",
        "youtube_activities",
        ["activity_type"],
    )

    op.create_index(
        "ix_youtube_activities_created_at",
        "youtube_activities",
        ["created_at"],
    )


def downgrade():
    op.drop_index(
        "ix_youtube_activities_created_at",
        table_name="youtube_activities",
    )

    op.drop_index(
        "ix_youtube_activities_activity_type",
        table_name="youtube_activities",
    )

    op.drop_index(
        "ix_youtube_activities_school_id",
        table_name="youtube_activities",
    )

    op.drop_index(
        "ix_youtube_activities_user_id",
        table_name="youtube_activities",
    )

    op.drop_index(
        "ix_youtube_activities_youtube_learning_id",
        table_name="youtube_activities",
    )

    op.drop_table("youtube_activities")
