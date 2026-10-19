"""Add CoreOne HR and payroll tables.

Revision ID: coreone_payroll_module_20261019
Revises: coreone_exam_builder_approval_20261016
Create Date: 2026-10-19
"""

from alembic import op
import sqlalchemy as sa


revision = "coreone_payroll_module_20261019"
down_revision = "coreone_exam_builder_approval_20261016"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "payroll_profiles",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("school_id", sa.Integer(), sa.ForeignKey("schools.id", ondelete="CASCADE"), nullable=False),
        sa.Column("staff_id", sa.Integer(), sa.ForeignKey("staff.id", ondelete="CASCADE"), nullable=False),
        sa.Column("basic_salary", sa.Numeric(12, 2), nullable=False),
        sa.Column("allowances", sa.JSON(), nullable=False),
        sa.Column("recurring_deductions", sa.JSON(), nullable=False),
        sa.Column("created_by", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL")),
        sa.Column("updated_by", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("school_id", "staff_id", name="uq_payroll_profile_school_staff"),
    )
    op.create_index("ix_payroll_profiles_id", "payroll_profiles", ["id"])
    op.create_index("ix_payroll_profiles_school_id", "payroll_profiles", ["school_id"])
    op.create_index("ix_payroll_profiles_staff_id", "payroll_profiles", ["staff_id"])

    op.create_table(
        "payroll_rules",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("school_id", sa.Integer(), sa.ForeignKey("schools.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("code", sa.String(60), nullable=False),
        sa.Column("category", sa.String(30), nullable=False),
        sa.Column("calculation", sa.String(20), nullable=False),
        sa.Column("rate", sa.Numeric(12, 4), nullable=False),
        sa.Column("basis", sa.String(20), nullable=False),
        sa.Column("effective_from", sa.Date(), nullable=False),
        sa.Column("effective_to", sa.Date(), nullable=True),
        sa.Column("enabled", sa.Boolean(), nullable=False),
        sa.Column("statutory", sa.Boolean(), nullable=False),
        sa.Column("created_by", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("school_id", "code", "effective_from", name="uq_payroll_rule_effective"),
    )
    op.create_index("ix_payroll_rules_id", "payroll_rules", ["id"])
    op.create_index("ix_payroll_rules_school_id", "payroll_rules", ["school_id"])

    op.create_table(
        "payroll_runs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("school_id", sa.Integer(), sa.ForeignKey("schools.id", ondelete="CASCADE"), nullable=False),
        sa.Column("year", sa.Integer(), nullable=False),
        sa.Column("month", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(20), nullable=False),
        sa.Column("total_gross", sa.Numeric(14, 2), nullable=False),
        sa.Column("total_deductions", sa.Numeric(14, 2), nullable=False),
        sa.Column("total_net", sa.Numeric(14, 2), nullable=False),
        sa.Column("created_by", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL")),
        sa.Column("approved_by", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint("school_id", "year", "month", name="uq_payroll_run_school_period"),
    )
    op.create_index("ix_payroll_runs_id", "payroll_runs", ["id"])
    op.create_index("ix_payroll_runs_school_id", "payroll_runs", ["school_id"])

    op.create_table(
        "payroll_items",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("run_id", sa.Integer(), sa.ForeignKey("payroll_runs.id", ondelete="CASCADE"), nullable=False),
        sa.Column("staff_id", sa.Integer(), sa.ForeignKey("staff.id", ondelete="SET NULL"), nullable=True),
        sa.Column("employee_number", sa.String(100), nullable=True),
        sa.Column("staff_name", sa.String(240), nullable=False),
        sa.Column("job_title", sa.String(160), nullable=True),
        sa.Column("basic_salary", sa.Numeric(12, 2), nullable=False),
        sa.Column("allowances", sa.JSON(), nullable=False),
        sa.Column("bonuses", sa.Numeric(12, 2), nullable=False),
        sa.Column("gross_pay", sa.Numeric(12, 2), nullable=False),
        sa.Column("rule_deductions", sa.JSON(), nullable=False),
        sa.Column("recurring_deductions", sa.JSON(), nullable=False),
        sa.Column("other_deductions", sa.JSON(), nullable=False),
        sa.Column("total_deductions", sa.Numeric(12, 2), nullable=False),
        sa.Column("net_pay", sa.Numeric(12, 2), nullable=False),
        sa.Column("payment_status", sa.String(20), nullable=False),
        sa.Column("payment_reference", sa.String(160), nullable=True),
        sa.Column("paid_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("run_id", "staff_id", name="uq_payroll_item_run_staff"),
    )
    op.create_index("ix_payroll_items_id", "payroll_items", ["id"])
    op.create_index("ix_payroll_items_run_id", "payroll_items", ["run_id"])
    op.create_index("ix_payroll_items_staff_id", "payroll_items", ["staff_id"])


def downgrade() -> None:
    op.drop_index("ix_payroll_items_staff_id", table_name="payroll_items")
    op.drop_index("ix_payroll_items_run_id", table_name="payroll_items")
    op.drop_index("ix_payroll_items_id", table_name="payroll_items")
    op.drop_table("payroll_items")

    op.drop_index("ix_payroll_runs_school_id", table_name="payroll_runs")
    op.drop_index("ix_payroll_runs_id", table_name="payroll_runs")
    op.drop_table("payroll_runs")

    op.drop_index("ix_payroll_rules_school_id", table_name="payroll_rules")
    op.drop_index("ix_payroll_rules_id", table_name="payroll_rules")
    op.drop_table("payroll_rules")

    op.drop_index("ix_payroll_profiles_staff_id", table_name="payroll_profiles")
    op.drop_index("ix_payroll_profiles_school_id", table_name="payroll_profiles")
    op.drop_index("ix_payroll_profiles_id", table_name="payroll_profiles")
    op.drop_table("payroll_profiles")
