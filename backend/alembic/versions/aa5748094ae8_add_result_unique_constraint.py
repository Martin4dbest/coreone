"""add result unique constraint

Revision ID: aa5748094ae8
Revises: c545df387a64
Create Date: 2026-07-16 19:04:55.029765

"""

from typing import Sequence, Union

from alembic import op


revision: str = "aa5748094ae8"
down_revision: Union[str, Sequence[str], None] = "c545df387a64"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_unique_constraint(
        "uq_student_subject_term_session_result",
        "results",
        [
            "student_id",
            "class_id",
            "subject_id",
            "term_id",
            "academic_session_id",
        ],
    )


def downgrade() -> None:
    op.drop_constraint(
        "uq_student_subject_term_session_result",
        "results",
        type_="unique",
    )
