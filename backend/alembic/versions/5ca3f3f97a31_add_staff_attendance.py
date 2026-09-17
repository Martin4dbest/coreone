"""add staff attendance

Revision ID: 5ca3f3f97a31
Revises: coreone_school_book_financials_20260915
Create Date: 2026-09-17 16:13:21.636003

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "5ca3f3f97a31"
down_revision: Union[str, Sequence[str], None] = (
    "coreone_school_book_financials_20260915"
)
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "staff_attendance",
        sa.Column("staff_id", sa.Integer(), nullable=False),
        sa.Column("school_id", sa.Integer(), nullable=False),
        sa.Column("attendance_date", sa.Date(), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("remarks", sa.String(length=255), nullable=True),
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
        sa.UniqueConstraint(
            "staff_id",
            "attendance_date",
            name="uq_staff_attendance_date",
        ),
        sa.UniqueConstraint("uuid"),
    )

    op.create_index(
        op.f("ix_staff_attendance_id"),
        "staff_attendance",
        ["id"],
        unique=False,
    )

    op.create_index(
        op.f("ix_staff_attendance_staff_id"),
        "staff_attendance",
        ["staff_id"],
        unique=False,
    )

    op.create_index(
        op.f("ix_staff_attendance_school_id"),
        "staff_attendance",
        ["school_id"],
        unique=False,
    )

    op.create_index(
        op.f("ix_staff_attendance_attendance_date"),
        "staff_attendance",
        ["attendance_date"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_staff_attendance_attendance_date"),
        table_name="staff_attendance",
    )

    op.drop_index(
        op.f("ix_staff_attendance_school_id"),
        table_name="staff_attendance",
    )

    op.drop_index(
        op.f("ix_staff_attendance_staff_id"),
        table_name="staff_attendance",
    )

    op.drop_index(
        op.f("ix_staff_attendance_id"),
        table_name="staff_attendance",
    )

    op.drop_table("staff_attendance")
