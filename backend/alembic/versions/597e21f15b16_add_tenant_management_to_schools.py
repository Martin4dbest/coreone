"""add tenant management to schools

Revision ID: 597e21f15b16
Revises: 980476b621d3
Create Date: 2026-07-24 04:48:42.620154
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "597e21f15b16"
down_revision: Union[str, Sequence[str], None] = "980476b621d3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "schools",
        sa.Column(
            "domain",
            sa.String(length=255),
            nullable=True,
        ),
    )

    op.add_column(
        "schools",
        sa.Column(
            "custom_domain",
            sa.String(length=255),
            nullable=True,
        ),
    )

    op.add_column(
        "schools",
        sa.Column(
            "domain_verified",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )

    op.add_column(
        "schools",
        sa.Column(
            "tenant_active",
            sa.Boolean(),
            nullable=False,
            server_default=sa.true(),
        ),
    )

    op.create_index(
        op.f("ix_schools_custom_domain"),
        "schools",
        ["custom_domain"],
        unique=True,
    )

    op.create_index(
        op.f("ix_schools_domain"),
        "schools",
        ["domain"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_schools_domain"), table_name="schools")
    op.drop_index(op.f("ix_schools_custom_domain"), table_name="schools")

    op.drop_column("schools", "tenant_active")
    op.drop_column("schools", "domain_verified")
    op.drop_column("schools", "custom_domain")
    op.drop_column("schools", "domain")
