"""make result unique constraint tenant safe

Revision ID: fix_results_tenant_unique_constraint
Revises: 282acb432a9a
Create Date: 2026-08-11
"""

from typing import Sequence, Union

from alembic import op


revision: str = "7f3a91c2d4e5"
down_revision: Union[str, Sequence[str], None] = "282acb432a9a"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_constraint(
        "uq_student_subject_term_session_result",
        "results",
        type_="unique",
    )

    op.create_unique_constraint(
        "uq_school_student_subject_term_session_result",
        "results",
        [
            "school_id",
            "student_id",
            "class_id",
            "subject_id",
            "term_id",
            "academic_session_id",
        ],
    )


def downgrade() -> None:
    op.drop_constraint(
        "uq_school_student_subject_term_session_result",
        "results",
        type_="unique",
    )

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
