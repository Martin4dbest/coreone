"""repair ebooks table

Revision ID: 7a4f2d91c8e3
Revises: 6d173c5bbf22
Create Date: 2026-08-07
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "7a4f2d91c8e3"
down_revision: Union[str, Sequence[str], None] = "6d173c5bbf22"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()

    inspector = sa.inspect(bind)
    tables = inspector.get_table_names()

    # The historical migration chain is inconsistent on some databases.
    # Create the base ebooks table if it does not exist.
    if "ebooks" not in tables:
        op.create_table(
            "ebooks",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("title", sa.String(length=200), nullable=False),
            sa.Column("author", sa.String(length=150), nullable=True),
            sa.Column("description", sa.Text(), nullable=True),
            sa.Column("file_url", sa.String(length=500), nullable=False),
            sa.Column("category", sa.String(length=100), nullable=True),
            sa.Column("uploaded_by", sa.Integer(), nullable=False),
            sa.Column("school_id", sa.Integer(), nullable=False),
            sa.Column(
                "is_active",
                sa.Boolean(),
                nullable=False,
                server_default=sa.true(),
            ),
            sa.Column("uuid", sa.String(length=36), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=True),
            sa.Column("updated_at", sa.DateTime(), nullable=True),
        )

        tables = inspector.get_table_names()

    # Refresh columns after possible table creation.
    columns = {
        column["name"]
        for column in sa.inspect(bind).get_columns("ebooks")
    }

    if "subject_id" not in columns:
        op.add_column(
            "ebooks",
            sa.Column("subject_id", sa.Integer(), nullable=True),
        )

    if "classroom_id" not in columns:
        op.add_column(
            "ebooks",
            sa.Column("classroom_id", sa.Integer(), nullable=True),
        )

    if "cover_image_url" not in columns:
        op.add_column(
            "ebooks",
            sa.Column(
                "cover_image_url",
                sa.String(length=500),
                nullable=True,
            ),
        )

    if "file_name" not in columns:
        op.add_column(
            "ebooks",
            sa.Column(
                "file_name",
                sa.String(length=255),
                nullable=True,
            ),
        )

    if "file_size" not in columns:
        op.add_column(
            "ebooks",
            sa.Column(
                "file_size",
                sa.Integer(),
                nullable=True,
            ),
        )

    if "file_type" not in columns:
        op.add_column(
            "ebooks",
            sa.Column(
                "file_type",
                sa.String(length=100),
                nullable=True,
            ),
        )

    if "featured" not in columns:
        op.add_column(
            "ebooks",
            sa.Column(
                "featured",
                sa.Boolean(),
                nullable=False,
                server_default=sa.false(),
            ),
        )

    if "download_count" not in columns:
        op.add_column(
            "ebooks",
            sa.Column(
                "download_count",
                sa.Integer(),
                nullable=False,
                server_default="0",
            ),
        )

    if "view_count" not in columns:
        op.add_column(
            "ebooks",
            sa.Column(
                "view_count",
                sa.Integer(),
                nullable=False,
                server_default="0",
            ),
        )

    inspector = sa.inspect(bind)

    indexes = {
        index["name"]
        for index in inspector.get_indexes("ebooks")
    }

    if "ix_ebooks_subject_id" not in indexes:
        op.create_index(
            "ix_ebooks_subject_id",
            "ebooks",
            ["subject_id"],
        )

    if "ix_ebooks_classroom_id" not in indexes:
        op.create_index(
            "ix_ebooks_classroom_id",
            "ebooks",
            ["classroom_id"],
        )


def downgrade() -> None:
    bind = op.get_bind()

    inspector = sa.inspect(bind)

    if "ebooks" not in inspector.get_table_names():
        return

    indexes = {
        index["name"]
        for index in inspector.get_indexes("ebooks")
    }

    if "ix_ebooks_classroom_id" in indexes:
        op.drop_index(
            "ix_ebooks_classroom_id",
            table_name="ebooks",
        )

    if "ix_ebooks_subject_id" in indexes:
        op.drop_index(
            "ix_ebooks_subject_id",
            table_name="ebooks",
        )

    columns = {
        column["name"]
        for column in sa.inspect(bind).get_columns("ebooks")
    }

    for column in [
        "view_count",
        "download_count",
        "featured",
        "file_type",
        "file_size",
        "file_name",
        "cover_image_url",
        "classroom_id",
        "subject_id",
    ]:
        if column in columns:
            op.drop_column("ebooks", column)
