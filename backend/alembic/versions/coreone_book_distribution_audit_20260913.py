"""add student book issue and return audit fields

Revision ID: coreone_book_distribution_audit_20260913
Revises: add_payment_setting_ref
"""

from alembic import op
import sqlalchemy as sa


revision = "coreone_book_distribution_audit_20260913"
down_revision = "add_payment_setting_ref"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "school_book_distribution_students",
        sa.Column(
            "issued_at",
            sa.DateTime(),
            nullable=True,
        ),
    )

    op.add_column(
        "school_book_distribution_students",
        sa.Column(
            "status",
            sa.String(20),
            nullable=False,
            server_default="ISSUED",
        ),
    )

    op.add_column(
        "school_book_distribution_students",
        sa.Column(
            "condition_at_issue",
            sa.String(100),
            nullable=True,
        ),
    )

    op.add_column(
        "school_book_distribution_students",
        sa.Column(
            "returned_at",
            sa.DateTime(),
            nullable=True,
        ),
    )

    op.add_column(
        "school_book_distribution_students",
        sa.Column(
            "returned_by",
            sa.Integer(),
            nullable=True,
        ),
    )

    op.add_column(
        "school_book_distribution_students",
        sa.Column(
            "return_condition",
            sa.String(100),
            nullable=True,
        ),
    )

    op.add_column(
        "school_book_distribution_students",
        sa.Column(
            "return_remarks",
            sa.Text(),
            nullable=True,
        ),
    )

    op.create_foreign_key(
        "fk_school_book_distribution_students_returned_by",
        "school_book_distribution_students",
        "users",
        ["returned_by"],
        ["id"],
        ondelete="SET NULL",
    )

    op.execute(
        """
        UPDATE school_book_distribution_students s
        SET issued_at = d.date_issued::timestamp
        FROM school_book_distributions d
        WHERE s.distribution_id = d.id
          AND s.issued_at IS NULL
        """
    )

    op.alter_column(
        "school_book_distribution_students",
        "status",
        server_default=None,
    )


def downgrade():
    op.drop_constraint(
        "fk_school_book_distribution_students_returned_by",
        "school_book_distribution_students",
        type_="foreignkey",
    )

    op.drop_column(
        "school_book_distribution_students",
        "return_remarks",
    )

    op.drop_column(
        "school_book_distribution_students",
        "return_condition",
    )

    op.drop_column(
        "school_book_distribution_students",
        "returned_by",
    )

    op.drop_column(
        "school_book_distribution_students",
        "returned_at",
    )

    op.drop_column(
        "school_book_distribution_students",
        "condition_at_issue",
    )

    op.drop_column(
        "school_book_distribution_students",
        "status",
    )

    op.drop_column(
        "school_book_distribution_students",
        "issued_at",
    )
