"""Add CoreOne staff appraisal records.

Revision ID: coreone_staff_appraisal_20261019
Revises: coreone_payroll_module_20261019
Create Date: 2026-10-19
"""

from alembic import op
import sqlalchemy as sa


revision = "coreone_staff_appraisal_20261019"
down_revision = "coreone_payroll_module_20261019"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "staff_appraisals",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("school_id", sa.Integer(), sa.ForeignKey("schools.id", ondelete="CASCADE"), nullable=False),
        sa.Column("staff_id", sa.Integer(), sa.ForeignKey("staff.id", ondelete="CASCADE"), nullable=False),
        sa.Column("teacher_id", sa.Integer(), sa.ForeignKey("teachers.id", ondelete="CASCADE"), nullable=False),
        sa.Column("period_start", sa.Date(), nullable=False),
        sa.Column("period_end", sa.Date(), nullable=False),
        sa.Column("category_ratings", sa.JSON(), nullable=False),
        sa.Column("category_evidence", sa.JSON(), nullable=False),
        sa.Column("overall_comments", sa.Text(), nullable=True),
        sa.Column("strengths", sa.Text(), nullable=True),
        sa.Column("improvement_plan", sa.Text(), nullable=True),
        sa.Column("development_targets", sa.Text(), nullable=True),
        sa.Column("weighted_score", sa.Float(), nullable=True),
        sa.Column("status", sa.String(20), nullable=False),
        sa.Column("created_by", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("approved_by", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint(
            "school_id",
            "staff_id",
            "period_start",
            "period_end",
            name="uq_staff_appraisal_school_staff_period",
        ),
    )
    op.create_index("ix_staff_appraisals_id", "staff_appraisals", ["id"])
    op.create_index("ix_staff_appraisals_school_id", "staff_appraisals", ["school_id"])
    op.create_index("ix_staff_appraisals_staff_id", "staff_appraisals", ["staff_id"])
    op.create_index("ix_staff_appraisals_teacher_id", "staff_appraisals", ["teacher_id"])


def downgrade() -> None:
    op.drop_index("ix_staff_appraisals_teacher_id", table_name="staff_appraisals")
    op.drop_index("ix_staff_appraisals_staff_id", table_name="staff_appraisals")
    op.drop_index("ix_staff_appraisals_school_id", table_name="staff_appraisals")
    op.drop_index("ix_staff_appraisals_id", table_name="staff_appraisals")
    op.drop_table("staff_appraisals")
