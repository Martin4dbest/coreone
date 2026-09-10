"""add uuid to school payment settings

Revision ID: 8eb4e62e39d6
Revises: b09462ae0e9a
"""

from typing import Sequence, Union
import uuid

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "8eb4e62e39d6"
down_revision: Union[str, Sequence[str], None] = "b09462ae0e9a"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "school_payment_settings",
        sa.Column(
            "uuid",
            postgresql.UUID(as_uuid=True),
            nullable=True,
        ),
    )

    connection = op.get_bind()

    rows = connection.execute(
        sa.text(
            """
            SELECT id
            FROM school_payment_settings
            WHERE uuid IS NULL
            """
        )
    ).fetchall()

    for row in rows:
        connection.execute(
            sa.text(
                """
                UPDATE school_payment_settings
                SET uuid = :uuid
                WHERE id = :id
                """
            ),
            {
                "uuid": str(uuid.uuid4()),
                "id": row.id,
            },
        )

    op.alter_column(
        "school_payment_settings",
        "uuid",
        nullable=False,
    )

    op.create_unique_constraint(
        "uq_school_payment_settings_uuid",
        "school_payment_settings",
        ["uuid"],
    )


def downgrade() -> None:
    op.drop_constraint(
        "uq_school_payment_settings_uuid",
        "school_payment_settings",
        type_="unique",
    )

    op.drop_column(
        "school_payment_settings",
        "uuid",
    )
