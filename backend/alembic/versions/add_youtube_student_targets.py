"""add youtube student targets

Revision ID: 9f6c2e7a1b33
Revises: c72a91f04e6b
Create Date: 2026-09-07
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "9f6c2e7a1b33"
down_revision: Union[str, Sequence[str], None] = "c72a91f04e6b"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "youtube_learning_students",
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
            "student_id",
            sa.Integer(),
            sa.ForeignKey(
                "students.id",
                ondelete="CASCADE",
            ),
            nullable=False,
        ),
        sa.UniqueConstraint(
            "youtube_learning_id",
            "student_id",
            name="uq_youtube_learning_student",
        ),
    )

    op.create_index(
        "ix_youtube_learning_students_youtube_learning_id",
        "youtube_learning_students",
        ["youtube_learning_id"],
    )

    op.create_index(
        "ix_youtube_learning_students_student_id",
        "youtube_learning_students",
        ["student_id"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_youtube_learning_students_student_id",
        table_name="youtube_learning_students",
    )

    op.drop_index(
        "ix_youtube_learning_students_youtube_learning_id",
        table_name="youtube_learning_students",
    )

    op.drop_table("youtube_learning_students")
