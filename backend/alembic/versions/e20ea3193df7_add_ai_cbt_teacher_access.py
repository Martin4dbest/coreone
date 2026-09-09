"""add ai cbt teacher access

Revision ID: e20ea3193df7
Revises: 9f6c2e7a1b33
Create Date: 2026-09-09 06:27:19.145023

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "e20ea3193df7"
down_revision: Union[str, Sequence[str], None] = "9f6c2e7a1b33"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "ai_cbt_teacher_access",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("school_id", sa.Integer(), nullable=False),
        sa.Column("classroom_id", sa.Integer(), nullable=False),
        sa.Column("issued_by_teacher_id", sa.Integer(), nullable=False),
        sa.Column("target_teacher_id", sa.Integer(), nullable=False),
        sa.Column("code_hash", sa.String(length=128), nullable=False),
        sa.Column("expires_at", sa.DateTime(), nullable=False),
        sa.Column("redeemed_at", sa.DateTime(), nullable=True),
        sa.Column("revoked_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(
            ["school_id"],
            ["schools.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["classroom_id"],
            ["classrooms.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["issued_by_teacher_id"],
            ["teachers.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["target_teacher_id"],
            ["teachers.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(
        "ix_ai_cbt_teacher_access_school_id",
        "ai_cbt_teacher_access",
        ["school_id"],
    )

    op.create_index(
        "ix_ai_cbt_teacher_access_classroom_id",
        "ai_cbt_teacher_access",
        ["classroom_id"],
    )

    op.create_index(
        "ix_ai_cbt_teacher_access_issued_by_teacher_id",
        "ai_cbt_teacher_access",
        ["issued_by_teacher_id"],
    )

    op.create_index(
        "ix_ai_cbt_teacher_access_target_teacher_id",
        "ai_cbt_teacher_access",
        ["target_teacher_id"],
    )

    op.create_index(
        "ix_ai_cbt_teacher_access_code_hash",
        "ai_cbt_teacher_access",
        ["code_hash"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_ai_cbt_teacher_access_code_hash",
        table_name="ai_cbt_teacher_access",
    )

    op.drop_index(
        "ix_ai_cbt_teacher_access_target_teacher_id",
        table_name="ai_cbt_teacher_access",
    )

    op.drop_index(
        "ix_ai_cbt_teacher_access_issued_by_teacher_id",
        table_name="ai_cbt_teacher_access",
    )

    op.drop_index(
        "ix_ai_cbt_teacher_access_classroom_id",
        table_name="ai_cbt_teacher_access",
    )

    op.drop_index(
        "ix_ai_cbt_teacher_access_school_id",
        table_name="ai_cbt_teacher_access",
    )

    op.drop_table("ai_cbt_teacher_access")
