"""Add payroll payslip publication tracking."""

from alembic import op
import sqlalchemy as sa

revision = "coreone_payslip_publishing"
down_revision = "coreone_staff_appraisal_20261019"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "payroll_items",
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "payroll_items",
        sa.Column(
            "published_by",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )
    op.create_index(
        "ix_payroll_items_published_at",
        "payroll_items",
        ["published_at"],
    )


def downgrade():
    op.drop_index(
        "ix_payroll_items_published_at",
        table_name="payroll_items",
    )
    op.drop_column("payroll_items", "published_by")
    op.drop_column("payroll_items", "published_at")
