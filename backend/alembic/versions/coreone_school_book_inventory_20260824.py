"""create school book inventory and student distribution tables

Revision ID: coreone_school_book_inventory_20260824
Revises: f66f8c422d14
"""

from alembic import op
import sqlalchemy as sa


revision = "coreone_school_book_inventory_20260824"
down_revision = "f66f8c422d14"
branch_labels = None
depends_on = None


def upgrade():

    # ------------------------------------------------------------
    # SCHOOL BOOK RECEIPTS
    # ------------------------------------------------------------
    op.create_table(
        "school_book_receipts",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("uuid", sa.UUID(), nullable=False, unique=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),

        sa.Column("school_id", sa.Integer(), nullable=False),
        sa.Column("school_book_id", sa.Integer(), nullable=False),

        sa.Column(
            "quantity_received",
            sa.Integer(),
            nullable=False,
        ),

        sa.Column(
            "date_received",
            sa.Date(),
            nullable=False,
        ),

        sa.Column(
            "supplier",
            sa.String(255),
            nullable=True,
        ),

        sa.Column(
            "reference_number",
            sa.String(100),
            nullable=True,
        ),

        sa.Column(
            "received_by",
            sa.Integer(),
            nullable=True,
        ),

        sa.Column(
            "notes",
            sa.Text(),
            nullable=True,
        ),

        sa.ForeignKeyConstraint(
            ["school_id"],
            ["schools.id"],
            ondelete="CASCADE",
        ),

        sa.ForeignKeyConstraint(
            ["school_book_id"],
            ["school_books.id"],
            ondelete="CASCADE",
        ),

        sa.ForeignKeyConstraint(
            ["received_by"],
            ["users.id"],
            ondelete="SET NULL",
        ),
    )

    op.create_index(
        "ix_school_book_receipts_school_id",
        "school_book_receipts",
        ["school_id"],
    )

    op.create_index(
        "ix_school_book_receipts_school_book_id",
        "school_book_receipts",
        ["school_book_id"],
    )

    # ------------------------------------------------------------
    # SCHOOL BOOK DISTRIBUTIONS
    # ------------------------------------------------------------
    op.create_table(
        "school_book_distributions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("uuid", sa.UUID(), nullable=False, unique=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),

        sa.Column("school_id", sa.Integer(), nullable=False),
        sa.Column("school_book_id", sa.Integer(), nullable=False),
        sa.Column("classroom_id", sa.Integer(), nullable=False),

        sa.Column(
            "quantity_issued",
            sa.Integer(),
            nullable=False,
        ),

        sa.Column(
            "student_count",
            sa.Integer(),
            nullable=False,
        ),

        sa.Column(
            "date_issued",
            sa.Date(),
            nullable=False,
        ),

        sa.Column(
            "issued_by",
            sa.Integer(),
            nullable=True,
        ),

        sa.Column(
            "notes",
            sa.Text(),
            nullable=True,
        ),

        sa.ForeignKeyConstraint(
            ["school_id"],
            ["schools.id"],
            ondelete="CASCADE",
        ),

        sa.ForeignKeyConstraint(
            ["school_book_id"],
            ["school_books.id"],
            ondelete="CASCADE",
        ),

        sa.ForeignKeyConstraint(
            ["classroom_id"],
            ["classrooms.id"],
            ondelete="CASCADE",
        ),

        sa.ForeignKeyConstraint(
            ["issued_by"],
            ["users.id"],
            ondelete="SET NULL",
        ),
    )

    op.create_index(
        "ix_school_book_distributions_school_id",
        "school_book_distributions",
        ["school_id"],
    )

    op.create_index(
        "ix_school_book_distributions_school_book_id",
        "school_book_distributions",
        ["school_book_id"],
    )

    op.create_index(
        "ix_school_book_distributions_classroom_id",
        "school_book_distributions",
        ["classroom_id"],
    )

    # ------------------------------------------------------------
    # INDIVIDUAL STUDENT DISTRIBUTIONS
    # ------------------------------------------------------------
    op.create_table(
        "school_book_distribution_students",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("uuid", sa.UUID(), nullable=False, unique=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),

        sa.Column("school_id", sa.Integer(), nullable=False),

        sa.Column(
            "distribution_id",
            sa.Integer(),
            nullable=False,
        ),

        sa.Column(
            "student_id",
            sa.Integer(),
            nullable=False,
        ),

        sa.Column(
            "quantity_issued",
            sa.Integer(),
            nullable=False,
            server_default="1",
        ),

        sa.ForeignKeyConstraint(
            ["school_id"],
            ["schools.id"],
            ondelete="CASCADE",
        ),

        sa.ForeignKeyConstraint(
            ["distribution_id"],
            ["school_book_distributions.id"],
            ondelete="CASCADE",
        ),

        sa.ForeignKeyConstraint(
            ["student_id"],
            ["students.id"],
            ondelete="CASCADE",
        ),
    )

    op.create_index(
        "ix_school_book_distribution_students_school_id",
        "school_book_distribution_students",
        ["school_id"],
    )

    op.create_index(
        "ix_school_book_distribution_students_distribution_id",
        "school_book_distribution_students",
        ["distribution_id"],
    )

    op.create_index(
        "ix_school_book_distribution_students_student_id",
        "school_book_distribution_students",
        ["student_id"],
    )


def downgrade():

    # Student-level distribution records first.
    op.drop_index(
        "ix_school_book_distribution_students_student_id",
        table_name="school_book_distribution_students",
    )

    op.drop_index(
        "ix_school_book_distribution_students_distribution_id",
        table_name="school_book_distribution_students",
    )

    op.drop_index(
        "ix_school_book_distribution_students_school_id",
        table_name="school_book_distribution_students",
    )

    op.drop_table(
        "school_book_distribution_students",
    )

    # Distribution records.
    op.drop_index(
        "ix_school_book_distributions_classroom_id",
        table_name="school_book_distributions",
    )

    op.drop_index(
        "ix_school_book_distributions_school_book_id",
        table_name="school_book_distributions",
    )

    op.drop_index(
        "ix_school_book_distributions_school_id",
        table_name="school_book_distributions",
    )

    op.drop_table(
        "school_book_distributions",
    )

    # Receipt records.
    op.drop_index(
        "ix_school_book_receipts_school_book_id",
        table_name="school_book_receipts",
    )

    op.drop_index(
        "ix_school_book_receipts_school_id",
        table_name="school_book_receipts",
    )

    op.drop_table(
        "school_book_receipts",
    )
