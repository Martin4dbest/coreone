"""add school payment settings

Revision ID: b09462ae0e9a
Revises: 26126742098e
Create Date: 2026-09-10 05:27:39.158888
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "b09462ae0e9a"
down_revision: Union[str, Sequence[str], None] = "26126742098e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "school_payment_settings",
        sa.Column("school_id", sa.Integer(), nullable=False),
        sa.Column(
            "provider",
            sa.String(length=50),
            nullable=False,
            server_default="paystack",
        ),
        sa.Column(
            "is_enabled",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
        sa.Column(
            "public_key",
            sa.String(length=255),
            nullable=True,
        ),
        sa.Column(
            "encrypted_secret_key",
            sa.Text(),
            nullable=True,
        ),
        sa.Column(
            "encrypted_webhook_secret",
            sa.Text(),
            nullable=True,
        ),
        sa.Column(
            "currency",
            sa.String(length=10),
            nullable=False,
            server_default="NGN",
        ),
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["school_id"],
            ["schools.id"],
            ondelete="CASCADE",
        ),
        sa.UniqueConstraint(
            "school_id",
            name="uq_school_payment_settings_school",
        ),
    )

    op.create_index(
        "ix_school_payment_settings_school_id",
        "school_payment_settings",
        ["school_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_school_payment_settings_school_id",
        table_name="school_payment_settings",
    )

    op.drop_table("school_payment_settings")
