"""add school book purchase and selling prices

Revision ID: coreone_school_book_financials_20260915
Revises: coreone_book_distribution_audit_20260913
"""

from alembic import op
import sqlalchemy as sa


revision = "coreone_school_book_financials_20260915"
down_revision = "coreone_book_distribution_audit_20260913"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "school_books",
        sa.Column(
            "selling_price",
            sa.Numeric(12, 2),
            nullable=False,
            server_default="0",
        ),
    )

    op.add_column(
        "school_book_receipts",
        sa.Column(
            "unit_purchase_cost",
            sa.Numeric(12, 2),
            nullable=False,
            server_default="0",
        ),
    )

    op.add_column(
        "school_book_receipts",
        sa.Column(
            "total_purchase_cost",
            sa.Numeric(14, 2),
            nullable=False,
            server_default="0",
        ),
    )

    op.add_column(
        "school_book_distribution_students",
        sa.Column(
            "unit_selling_price",
            sa.Numeric(12, 2),
            nullable=False,
            server_default="0",
        ),
    )

    op.add_column(
        "school_book_distribution_students",
        sa.Column(
            "total_selling_amount",
            sa.Numeric(14, 2),
            nullable=False,
            server_default="0",
        ),
    )


def downgrade():
    op.drop_column(
        "school_book_distribution_students",
        "total_selling_amount",
    )
    op.drop_column(
        "school_book_distribution_students",
        "unit_selling_price",
    )
    op.drop_column(
        "school_book_receipts",
        "total_purchase_cost",
    )
    op.drop_column(
        "school_book_receipts",
        "unit_purchase_cost",
    )
    op.drop_column(
        "school_books",
        "selling_price",
    )
