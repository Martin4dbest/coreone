"""add cbt questions attempts answers tables

Revision ID: 1a6bbab826f9
Revises: c29c2987324d
Create Date: 2026-07-31

"""

from alembic import op
import sqlalchemy as sa


revision = "1a6bbab826f9"
down_revision = "c29c2987324d"

branch_labels = None
depends_on = None


def upgrade():

    op.create_table(
        "cbt_questions",

        sa.Column(
            "id",
            sa.Integer(),
            primary_key=True,
        ),

        sa.Column(
            "exam_id",
            sa.Integer(),
            nullable=False,
        ),

        sa.Column(
            "question",
            sa.Text(),
            nullable=False,
        ),

        sa.Column(
            "image_url",
            sa.String(500),
            nullable=True,
        ),

        sa.Column(
            "option_a",
            sa.Text(),
            nullable=False,
        ),

        sa.Column(
            "option_b",
            sa.Text(),
            nullable=False,
        ),

        sa.Column(
            "option_c",
            sa.Text(),
            nullable=False,
        ),

        sa.Column(
            "option_d",
            sa.Text(),
            nullable=False,
        ),

        sa.Column(
            "option_e",
            sa.Text(),
            nullable=True,
        ),

        sa.Column(
            "correct_answer",
            sa.String(5),
            nullable=False,
        ),

        sa.Column(
            "explanation",
            sa.Text(),
            nullable=True,
        ),

        sa.Column(
            "marks",
            sa.Integer(),
            default=1,
        ),

        sa.Column(
            "randomize_options",
            sa.Boolean(),
            default=True,
        ),
    )


    op.create_table(
        "cbt_attempts",

        sa.Column(
            "id",
            sa.Integer(),
            primary_key=True,
        ),

        sa.Column(
            "exam_id",
            sa.Integer(),
            nullable=False,
        ),

        sa.Column(
            "student_id",
            sa.Integer(),
            nullable=False,
        ),

        sa.Column(
            "started_at",
            sa.DateTime(),
            nullable=True,
        ),

        sa.Column(
            "submitted_at",
            sa.DateTime(),
            nullable=True,
        ),

        sa.Column(
            "score",
            sa.Integer(),
            default=0,
        ),

        sa.Column(
            "total_marks",
            sa.Integer(),
            default=0,
        ),

        sa.Column(
            "completed",
            sa.Boolean(),
            default=False,
        ),
    )


    op.create_table(
        "cbt_answers",

        sa.Column(
            "id",
            sa.Integer(),
            primary_key=True,
        ),

        sa.Column(
            "attempt_id",
            sa.Integer(),
            nullable=False,
        ),

        sa.Column(
            "question_id",
            sa.Integer(),
            nullable=False,
        ),

        sa.Column(
            "selected_answer",
            sa.String(5),
            nullable=True,
        ),

        sa.Column(
            "is_correct",
            sa.Boolean(),
            default=False,
        ),

        sa.Column(
            "marks_awarded",
            sa.Integer(),
            default=0,
        ),

        sa.Column(
            "time_spent_seconds",
            sa.Integer(),
            default=0,
        ),

        sa.Column(
            "flagged",
            sa.Boolean(),
            default=False,
        ),
    )


def downgrade():

    op.drop_table("cbt_answers")
    op.drop_table("cbt_attempts")
    op.drop_table("cbt_questions")
