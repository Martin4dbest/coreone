"""add cbt provider fields

Revision ID: e3dbdaf5bd2f
Revises: e224c119f3bb
Create Date: 2026-08-01 11:36:32.999611
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "e3dbdaf5bd2f"
down_revision: Union[str, Sequence[str], None] = "e224c119f3bb"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    question_source = sa.Enum(
        "INTERNAL",
        "API",
        "IMPORT",
        "AI",
        name="questionsource",
    )

    question_source.create(op.get_bind(), checkfirst=True)

    op.add_column(
        "cbt_exams",
        sa.Column(
            "source_type",
            question_source,
            nullable=False,
            server_default="INTERNAL",
        ),
    )

    op.add_column(
        "cbt_exams",
        sa.Column(
            "provider_name",
            sa.String(length=100),
            nullable=True,
        ),
    )

    op.add_column(
        "cbt_exams",
        sa.Column(
            "api_endpoint",
            sa.String(length=500),
            nullable=True,
        ),
    )

    op.add_column(
        "cbt_exams",
        sa.Column(
            "api_key",
            sa.String(length=500),
            nullable=True,
        ),
    )

    op.add_column(
        "cbt_exams",
        sa.Column(
            "import_file",
            sa.String(length=500),
            nullable=True,
        ),
    )


def downgrade() -> None:
    op.drop_column("cbt_exams", "import_file")
    op.drop_column("cbt_exams", "api_key")
    op.drop_column("cbt_exams", "api_endpoint")
    op.drop_column("cbt_exams", "provider_name")
    op.drop_column("cbt_exams", "source_type")

    sa.Enum(
        name="questionsource",
    ).drop(
        op.get_bind(),
        checkfirst=True,
    )
