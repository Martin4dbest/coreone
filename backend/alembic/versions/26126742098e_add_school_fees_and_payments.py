"""add school fees and payments

Revision ID: 26126742098e
Revises: f970d191e423
Create Date: 2026-09-09

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "26126742098e"
down_revision: Union[str, Sequence[str], None] = "f970d191e423"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create School Fees & Payments tables."""

    op.create_table(
        "fee_structures",
        sa.Column("academic_session_id", sa.Integer(), nullable=False),
        sa.Column("term_id", sa.Integer(), nullable=False),
        sa.Column("classroom_id", sa.Integer(), nullable=True),
        sa.Column("name", sa.String(length=150), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("uuid", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("school_id", sa.Integer(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(
            ["academic_session_id"],
            ["academic_sessions.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["term_id"],
            ["terms.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["classroom_id"],
            ["classrooms.id"],
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["school_id"],
            ["schools.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("uuid"),
        sa.UniqueConstraint(
            "school_id",
            "academic_session_id",
            "term_id",
            "classroom_id",
            "name",
            name="uq_fee_structures_scope_name",
        ),
    )

    op.create_index(
        "ix_fee_structures_id",
        "fee_structures",
        ["id"],
        unique=False,
    )
    op.create_index(
        "ix_fee_structures_academic_session_id",
        "fee_structures",
        ["academic_session_id"],
        unique=False,
    )
    op.create_index(
        "ix_fee_structures_term_id",
        "fee_structures",
        ["term_id"],
        unique=False,
    )
    op.create_index(
        "ix_fee_structures_classroom_id",
        "fee_structures",
        ["classroom_id"],
        unique=False,
    )
    op.create_index(
        "ix_fee_structures_school_id",
        "fee_structures",
        ["school_id"],
        unique=False,
    )

    op.create_table(
        "fee_structure_items",
        sa.Column("fee_structure_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=150), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "amount",
            sa.Numeric(precision=12, scale=2),
            nullable=False,
        ),
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("uuid", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(
            ["fee_structure_id"],
            ["fee_structures.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("uuid"),
    )

    op.create_index(
        "ix_fee_structure_items_id",
        "fee_structure_items",
        ["id"],
        unique=False,
    )
    op.create_index(
        "ix_fee_structure_items_fee_structure_id",
        "fee_structure_items",
        ["fee_structure_id"],
        unique=False,
    )

    op.create_table(
        "student_fees",
        sa.Column("student_id", sa.Integer(), nullable=False),
        sa.Column("fee_structure_id", sa.Integer(), nullable=False),
        sa.Column(
            "invoice_number",
            sa.String(length=100),
            nullable=False,
        ),
        sa.Column(
            "amount_due",
            sa.Numeric(precision=12, scale=2),
            nullable=False,
        ),
        sa.Column(
            "amount_paid",
            sa.Numeric(precision=12, scale=2),
            nullable=False,
        ),
        sa.Column(
            "adjustment_amount",
            sa.Numeric(precision=12, scale=2),
            nullable=False,
        ),
        sa.Column("adjustment_reason", sa.Text(), nullable=True),
        sa.Column(
            "status",
            sa.String(length=30),
            nullable=False,
        ),
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("uuid", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("school_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(
            ["student_id"],
            ["students.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["fee_structure_id"],
            ["fee_structures.id"],
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["school_id"],
            ["schools.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("uuid"),
        sa.UniqueConstraint(
            "school_id",
            "student_id",
            "fee_structure_id",
            name="uq_student_fees_student_structure",
        ),
    )

    op.create_index(
        "ix_student_fees_id",
        "student_fees",
        ["id"],
        unique=False,
    )
    op.create_index(
        "ix_student_fees_student_id",
        "student_fees",
        ["student_id"],
        unique=False,
    )
    op.create_index(
        "ix_student_fees_fee_structure_id",
        "student_fees",
        ["fee_structure_id"],
        unique=False,
    )
    op.create_index(
        "ix_student_fees_invoice_number",
        "student_fees",
        ["invoice_number"],
        unique=True,
    )
    op.create_index(
        "ix_student_fees_school_id",
        "student_fees",
        ["school_id"],
        unique=False,
    )
    op.create_index(
        "ix_student_fees_status",
        "student_fees",
        ["status"],
        unique=False,
    )

    op.create_table(
        "payments",
        sa.Column("student_fee_id", sa.Integer(), nullable=False),
        sa.Column("parent_id", sa.Integer(), nullable=True),
        sa.Column(
            "amount",
            sa.Numeric(precision=12, scale=2),
            nullable=False,
        ),
        sa.Column(
            "currency",
            sa.String(length=10),
            nullable=False,
        ),
        sa.Column(
            "provider",
            sa.String(length=50),
            nullable=False,
        ),
        sa.Column(
            "transaction_reference",
            sa.String(length=150),
            nullable=False,
        ),
        sa.Column(
            "gateway_transaction_id",
            sa.String(length=150),
            nullable=True,
        ),
        sa.Column(
            "status",
            sa.String(length=30),
            nullable=False,
        ),
        sa.Column("gateway_response", sa.Text(), nullable=True),
        sa.Column("paid_at", sa.DateTime(), nullable=True),
        sa.Column("verified_at", sa.DateTime(), nullable=True),
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("uuid", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("school_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(
            ["student_fee_id"],
            ["student_fees.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["parent_id"],
            ["parents.id"],
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["school_id"],
            ["schools.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("uuid"),
    )

    op.create_index(
        "ix_payments_id",
        "payments",
        ["id"],
        unique=False,
    )
    op.create_index(
        "ix_payments_student_fee_id",
        "payments",
        ["student_fee_id"],
        unique=False,
    )
    op.create_index(
        "ix_payments_parent_id",
        "payments",
        ["parent_id"],
        unique=False,
    )
    op.create_index(
        "ix_payments_school_id",
        "payments",
        ["school_id"],
        unique=False,
    )
    op.create_index(
        "ix_payments_provider",
        "payments",
        ["provider"],
        unique=False,
    )
    op.create_index(
        "ix_payments_status",
        "payments",
        ["status"],
        unique=False,
    )
    op.create_index(
        "ix_payments_gateway_transaction_id",
        "payments",
        ["gateway_transaction_id"],
        unique=False,
    )
    op.create_index(
        "ix_payments_transaction_reference",
        "payments",
        ["transaction_reference"],
        unique=True,
    )


def downgrade() -> None:
    """Remove School Fees & Payments tables."""

    op.drop_index(
        "ix_payments_transaction_reference",
        table_name="payments",
    )
    op.drop_index(
        "ix_payments_gateway_transaction_id",
        table_name="payments",
    )
    op.drop_index(
        "ix_payments_status",
        table_name="payments",
    )
    op.drop_index(
        "ix_payments_provider",
        table_name="payments",
    )
    op.drop_index(
        "ix_payments_school_id",
        table_name="payments",
    )
    op.drop_index(
        "ix_payments_parent_id",
        table_name="payments",
    )
    op.drop_index(
        "ix_payments_student_fee_id",
        table_name="payments",
    )
    op.drop_index(
        "ix_payments_id",
        table_name="payments",
    )
    op.drop_table("payments")

    op.drop_index(
        "ix_student_fees_status",
        table_name="student_fees",
    )
    op.drop_index(
        "ix_student_fees_school_id",
        table_name="student_fees",
    )
    op.drop_index(
        "ix_student_fees_invoice_number",
        table_name="student_fees",
    )
    op.drop_index(
        "ix_student_fees_fee_structure_id",
        table_name="student_fees",
    )
    op.drop_index(
        "ix_student_fees_student_id",
        table_name="student_fees",
    )
    op.drop_index(
        "ix_student_fees_id",
        table_name="student_fees",
    )
    op.drop_table("student_fees")

    op.drop_index(
        "ix_fee_structure_items_fee_structure_id",
        table_name="fee_structure_items",
    )
    op.drop_index(
        "ix_fee_structure_items_id",
        table_name="fee_structure_items",
    )
    op.drop_table("fee_structure_items")

    op.drop_index(
        "ix_fee_structures_school_id",
        table_name="fee_structures",
    )
    op.drop_index(
        "ix_fee_structures_classroom_id",
        table_name="fee_structures",
    )
    op.drop_index(
        "ix_fee_structures_term_id",
        table_name="fee_structures",
    )
    op.drop_index(
        "ix_fee_structures_academic_session_id",
        table_name="fee_structures",
    )
    op.drop_index(
        "ix_fee_structures_id",
        table_name="fee_structures",
    )
    op.drop_table("fee_structures")
