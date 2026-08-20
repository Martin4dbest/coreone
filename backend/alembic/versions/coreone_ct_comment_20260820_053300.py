"""Add report-level class teacher comment

Revision ID: coreone_ct_comment_20260820_053300
Revises: coreone_result_publish_20260820_032401
"""

from alembic import op
import sqlalchemy as sa


revision = "coreone_ct_comment_20260820_053300"
down_revision = "coreone_result_publish_20260820_032401"
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    columns = {
        col["name"]
        for col in inspector.get_columns("results")
    }

    if "class_teacher_comment" not in columns:
        op.add_column(
            "results",
            sa.Column(
                "class_teacher_comment",
                sa.Text(),
                nullable=True,
            ),
        )


def downgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    columns = {
        col["name"]
        for col in inspector.get_columns("results")
    }

    if "class_teacher_comment" in columns:
        op.drop_column("results", "class_teacher_comment")
