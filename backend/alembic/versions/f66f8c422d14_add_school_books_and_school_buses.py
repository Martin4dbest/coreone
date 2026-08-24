"""add school books and school buses

Revision ID: f66f8c422d14
Revises: coreone_ct_comment_20260820_053300
"""

from alembic import op
import sqlalchemy as sa


revision = "f66f8c422d14"
down_revision = "coreone_ct_comment_20260820_053300"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "school_books",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("uuid", sa.UUID(), nullable=False, unique=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.Column("school_id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("author", sa.String(255), nullable=True),
        sa.Column("isbn", sa.String(100), nullable=True),
        sa.Column("category", sa.String(100), nullable=True),
        sa.Column("subject_id", sa.Integer(), nullable=True),
        sa.Column("quantity", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.ForeignKeyConstraint(
            ["school_id"],
            ["schools.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["subject_id"],
            ["subjects.id"],
            ondelete="SET NULL",
        ),
    )

    op.create_index(
        "ix_school_books_id",
        "school_books",
        ["id"],
        unique=False,
    )

    op.create_index(
        "ix_school_books_uuid",
        "school_books",
        ["uuid"],
        unique=True,
    )

    op.create_index(
        "ix_school_books_school_id",
        "school_books",
        ["school_id"],
        unique=False,
    )

    op.create_index(
        "ix_school_books_subject_id",
        "school_books",
        ["subject_id"],
        unique=False,
    )

    op.create_table(
        "school_buses",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("uuid", sa.UUID(), nullable=False, unique=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.Column("school_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("registration_number", sa.String(50), nullable=False),
        sa.Column("driver_name", sa.String(255), nullable=True),
        sa.Column("driver_phone", sa.String(50), nullable=True),
        sa.Column("capacity", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.ForeignKeyConstraint(
            ["school_id"],
            ["schools.id"],
            ondelete="CASCADE",
        ),
    )

    op.create_index(
        "ix_school_buses_id",
        "school_buses",
        ["id"],
        unique=False,
    )

    op.create_index(
        "ix_school_buses_uuid",
        "school_buses",
        ["uuid"],
        unique=True,
    )

    op.create_index(
        "ix_school_buses_school_id",
        "school_buses",
        ["school_id"],
        unique=False,
    )


def downgrade():
    op.drop_index("ix_school_buses_school_id", table_name="school_buses")
    op.drop_index("ix_school_buses_uuid", table_name="school_buses")
    op.drop_index("ix_school_buses_id", table_name="school_buses")
    op.drop_table("school_buses")

    op.drop_index("ix_school_books_subject_id", table_name="school_books")
    op.drop_index("ix_school_books_school_id", table_name="school_books")
    op.drop_index("ix_school_books_uuid", table_name="school_books")
    op.drop_index("ix_school_books_id", table_name="school_books")
    op.drop_table("school_books")
