"""add extra staff profile details

Revision ID: 4c260aab48db
Revises: fc887ca9459d
Create Date: 2026-09-17
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "4c260aab48db"
down_revision: Union[str, Sequence[str], None] = "fc887ca9459d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("staff", sa.Column("middle_name", sa.String(100), nullable=True))
    op.add_column("staff", sa.Column("gender", sa.String(20), nullable=True))
    op.add_column("staff", sa.Column("date_of_birth", sa.Date(), nullable=True))
    op.add_column("staff", sa.Column("phone", sa.String(30), nullable=True))
    op.add_column("staff", sa.Column("address", sa.String(500), nullable=True))

    op.add_column("staff", sa.Column("job_title", sa.String(150), nullable=True))
    op.add_column("staff", sa.Column("department", sa.String(150), nullable=True))
    op.add_column("staff", sa.Column("employment_type", sa.String(50), nullable=True))
    op.add_column("staff", sa.Column("date_employed", sa.Date(), nullable=True))

    op.add_column("staff", sa.Column("qualification", sa.String(255), nullable=True))

    op.add_column(
        "staff",
        sa.Column("emergency_contact_name", sa.String(150), nullable=True),
    )
    op.add_column(
        "staff",
        sa.Column("emergency_contact_relationship", sa.String(100), nullable=True),
    )
    op.add_column(
        "staff",
        sa.Column("emergency_contact_phone", sa.String(30), nullable=True),
    )

    op.add_column(
        "staff",
        sa.Column("profile_photo", sa.String(500), nullable=True),
    )
    op.add_column("staff", sa.Column("notes", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("staff", "notes")
    op.drop_column("staff", "profile_photo")
    op.drop_column("staff", "emergency_contact_phone")
    op.drop_column("staff", "emergency_contact_relationship")
    op.drop_column("staff", "emergency_contact_name")
    op.drop_column("staff", "qualification")
    op.drop_column("staff", "date_employed")
    op.drop_column("staff", "employment_type")
    op.drop_column("staff", "department")
    op.drop_column("staff", "job_title")
    op.drop_column("staff", "address")
    op.drop_column("staff", "phone")
    op.drop_column("staff", "date_of_birth")
    op.drop_column("staff", "gender")
    op.drop_column("staff", "middle_name")
