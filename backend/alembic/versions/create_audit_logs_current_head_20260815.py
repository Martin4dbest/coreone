"""create audit_logs table from current migration head

Revision ID: audit_logs_head_20260815
Revises: add_primary_school_admin
Create Date: 2026-08-15

This migration creates the audit_logs table that was declared by
the AuditLog model but was never created by the historical
252df94a178e audit migration because that migration contains only pass.
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "audit_logs_head_20260815"
down_revision: Union[str, Sequence[str], None] = "add_primary_school_admin"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create the missing audit_logs table."""
    op.create_table(
        "audit_logs",

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
            nullable=False,
        ),

        sa.Column(
            "updated_at",
            sa.DateTime(),
            nullable=False,
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
            "user_id",
            sa.Integer(),
            nullable=False,
        ),

        sa.Column(
            "action",
            sa.String(length=100),
            nullable=False,
        ),

        sa.Column(
            "entity",
            sa.String(length=100),
            nullable=False,
        ),

        sa.Column(
            "entity_id",
            sa.Integer(),
            nullable=True,
        ),

        sa.Column(
            "description",
            sa.Text(),
            nullable=True,
        ),

        sa.UniqueConstraint(
            "uuid",
            name="uq_audit_logs_uuid",
        ),
    )

    op.create_index(
        "ix_audit_logs_id",
        "audit_logs",
        ["id"],
        unique=False,
    )

    op.create_index(
        "ix_audit_logs_uuid",
        "audit_logs",
        ["uuid"],
        unique=False,
    )

    op.create_index(
        "ix_audit_logs_school_id",
        "audit_logs",
        ["school_id"],
        unique=False,
    )


def downgrade() -> None:
    """Remove the audit_logs table."""
    op.drop_index(
        "ix_audit_logs_school_id",
        table_name="audit_logs",
    )

    op.drop_index(
        "ix_audit_logs_uuid",
        table_name="audit_logs",
    )

    op.drop_index(
        "ix_audit_logs_id",
        table_name="audit_logs",
    )

    op.drop_table("audit_logs")
