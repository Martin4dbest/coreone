"""add parent student relationships

Revision ID: 67cb5767af36
Revises: coreone_school_book_inventory_20260824
Create Date: 2026-08-29 09:15:43.589984

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "67cb5767af36"
down_revision: Union[str, Sequence[str], None] = (
    "coreone_school_book_inventory_20260824"
)
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create parent/student relationship table."""

    op.create_table(
        "parent_students",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("parent_id", sa.Integer(), nullable=False),
        sa.Column("student_id", sa.Integer(), nullable=False),
        sa.Column(
            "relationship_type",
            sa.String(length=50),
            nullable=False,
            server_default="Parent/Guardian",
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["parent_id"],
            ["parents.id"],
            name="fk_parent_students_parent_id",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["student_id"],
            ["students.id"],
            name="fk_parent_students_student_id",
            ondelete="CASCADE",
        ),
        sa.UniqueConstraint(
            "parent_id",
            "student_id",
            name="uq_parent_student",
        ),
    )

    op.create_index(
        "ix_parent_students_id",
        "parent_students",
        ["id"],
        unique=False,
    )

    op.create_index(
        "ix_parent_students_parent_id",
        "parent_students",
        ["parent_id"],
        unique=False,
    )

    op.create_index(
        "ix_parent_students_student_id",
        "parent_students",
        ["student_id"],
        unique=False,
    )


def downgrade() -> None:
    """Remove parent/student relationship table."""

    op.drop_index(
        "ix_parent_students_student_id",
        table_name="parent_students",
    )

    op.drop_index(
        "ix_parent_students_parent_id",
        table_name="parent_students",
    )

    op.drop_index(
        "ix_parent_students_id",
        table_name="parent_students",
    )

    op.drop_table("parent_students")
