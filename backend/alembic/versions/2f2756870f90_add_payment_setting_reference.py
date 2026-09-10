"""add payment setting reference to payments

Revision ID: add_payment_setting_ref
Revises: 8eb4e62e39d6
"""

from alembic import op
import sqlalchemy as sa


revision = "add_payment_setting_ref"
down_revision = "8eb4e62e39d6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "payments",
        sa.Column(
            "payment_setting_id",
            sa.Integer(),
            nullable=True,
        ),
    )

    op.create_index(
        "ix_payments_payment_setting_id",
        "payments",
        ["payment_setting_id"],
        unique=False,
    )

    op.create_foreign_key(
        "fk_payments_payment_setting_id",
        "payments",
        "school_payment_settings",
        ["payment_setting_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint(
        "fk_payments_payment_setting_id",
        "payments",
        type_="foreignkey",
    )

    op.drop_index(
        "ix_payments_payment_setting_id",
        table_name="payments",
    )

    op.drop_column(
        "payments",
        "payment_setting_id",
    )
