"""add uuid to school licensing"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "f1a7c93d52b8"
down_revision = "9c4f7a21d8e3"
branch_labels = None
depends_on = None


def upgrade():
    # Add the UUID column temporarily as nullable so existing
    # school_licensing rows can be populated safely.
    op.add_column(
        "school_licensing",
        sa.Column(
            "uuid",
            postgresql.UUID(as_uuid=True),
            nullable=True,
        ),
    )

    # Generate a unique UUID for every existing row.
    op.execute(
        """
        UPDATE school_licensing
        SET uuid = gen_random_uuid()
        WHERE uuid IS NULL
        """
    )

    # UUID is required by CoreOne BaseModel.
    op.alter_column(
        "school_licensing",
        "uuid",
        existing_type=postgresql.UUID(as_uuid=True),
        nullable=False,
    )

    op.create_unique_constraint(
        "uq_school_licensing_uuid",
        "school_licensing",
        ["uuid"],
    )

    op.create_index(
        "ix_school_licensing_uuid",
        "school_licensing",
        ["uuid"],
        unique=True,
    )


def downgrade():
    op.drop_index(
        "ix_school_licensing_uuid",
        table_name="school_licensing",
    )

    op.drop_constraint(
        "uq_school_licensing_uuid",
        "school_licensing",
        type_="unique",
    )

    op.drop_column(
        "school_licensing",
        "uuid",
    )
