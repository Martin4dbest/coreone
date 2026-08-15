"""repair missing notifications table

The historical notifications migration 456b287eda0f contained only
pass, so Alembic considered the migration applied even though the
notifications table was never created.

This migration creates the table from the current migration head.
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "repair_notifications_20260815"
down_revision: Union[str, Sequence[str], None] = "audit_logs_head_20260815"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create the missing notifications table."""

    op.create_table(
        "notifications",

        sa.Column(
            "id",
            sa.Integer(),
            primary_key=True,
            nullable=False,
        ),

        sa.Column(
            "uuid",
            postgresql.UUID(as_uuid=True),
            nullable=False,
        ),

        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=True,
        ),

        sa.Column(
            "updated_at",
            sa.DateTime(),
            nullable=True,
        ),

        sa.Column(
            "school_id",
            sa.Integer(),
            sa.ForeignKey(
                "schools.id",
                ondelete="CASCADE",
            ),
            nullable=False,
        ),

        sa.Column(
            "title",
            sa.String(length=200),
            nullable=False,
        ),

        sa.Column(
            "message",
            sa.Text(),
            nullable=False,
        ),

        sa.Column(
            "recipient_type",
            sa.String(length=50),
            nullable=True,
        ),

        sa.Column(
            "is_read",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),

        sa.Column(
            "sent_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.func.now(),
        ),

        sa.Column(
            "is_active",
            sa.Boolean(),
            nullable=False,
            server_default=sa.true(),
        ),

        sa.UniqueConstraint(
            "uuid",
            name="uq_notifications_uuid",
        ),
    )

    op.create_index(
        "ix_notifications_id",
        "notifications",
        ["id"],
        unique=False,
    )

    op.create_index(
        "ix_notifications_school_id",
        "notifications",
        ["school_id"],
        unique=False,
    )


def downgrade() -> None:
    """Remove the repaired notifications table."""

    op.drop_index(
        "ix_notifications_school_id",
        table_name="notifications",
    )

    op.drop_index(
        "ix_notifications_id",
        table_name="notifications",
    )

    op.drop_table("notifications")
