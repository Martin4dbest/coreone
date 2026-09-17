"""add staff leave

Revision ID: fc887ca9459d
Revises: 5ca3f3f97a31
Create Date: 2026-09-17 16:22:19.758777

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "fc887ca9459d"
down_revision: Union[str, Sequence[str], None] = "5ca3f3f97a31"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "staff_leaves",
        sa.Column("staff_id", sa.Integer(), nullable=False),
        sa.Column("school_id", sa.Integer(), nullable=False),
        sa.Column("leave_type", sa.String(length=50), nullable=False),
        sa.Column("start_date", sa.Date(), nullable=False),
        sa.Column("end_date", sa.Date(), nullable=False),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("admin_remarks", sa.Text(), nullable=True),
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("uuid", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(
            ["school_id"],
            ["schools.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["staff_id"],
            ["staff.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("uuid"),
    )

    op.create_index(
        op.f("ix_staff_leaves_id"),
        "staff_leaves",
        ["id"],
        unique=False,
    )

    op.create_index(
        op.f("ix_staff_leaves_school_id"),
        "staff_leaves",
        ["school_id"],
        unique=False,
    )

    op.create_index(
        op.f("ix_staff_leaves_staff_id"),
        "staff_leaves",
        ["staff_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_staff_leaves_staff_id"),
        table_name="staff_leaves",
    )

    op.drop_index(
        op.f("ix_staff_leaves_school_id"),
        table_name="staff_leaves",
    )

    op.drop_index(
        op.f("ix_staff_leaves_id"),
        table_name="staff_leaves",
    )

    op.drop_table("staff_leaves")
