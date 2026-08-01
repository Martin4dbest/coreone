"""add cbt tables

Revision ID: b7c9d2e4f111
Revises: a5347ab26e16
Create Date: 2026-07-31

"""

from alembic import op
import sqlalchemy as sa


revision = "b7c9d2e4f111"

down_revision = "a5347ab26e16"

branch_labels = None

depends_on = None



def upgrade():

    op.create_table(
        "cbt_exams",

        sa.Column(
            "id",
            sa.Integer(),
            primary_key=True,
        ),

        sa.Column(
            "school_id",
            sa.Integer(),
            nullable=False,
        ),

        sa.Column(
            "title",
            sa.String(200),
            nullable=False,
        ),

        sa.Column(
            "description",
            sa.Text(),
            nullable=True,
        ),

        sa.Column(
            "subject_id",
            sa.Integer(),
            nullable=False,
        ),

        sa.Column(
            "class_id",
            sa.Integer(),
            nullable=True,
        ),

        sa.Column(
            "duration_minutes",
            sa.Integer(),
            default=60,
        ),

        sa.Column(
            "total_questions",
            sa.Integer(),
            default=50,
        ),

        sa.Column(
            "total_marks",
            sa.Integer(),
            default=50,
        ),

        sa.Column(
            "created_by",
            sa.Integer(),
            nullable=False,
        ),

        sa.Column(
            "is_active",
            sa.Boolean(),
            default=True,
        ),

    )


def downgrade():

    op.drop_table(
        "cbt_exams"
    )
