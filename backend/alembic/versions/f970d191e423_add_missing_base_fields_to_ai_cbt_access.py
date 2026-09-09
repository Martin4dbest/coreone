"""add missing base fields to ai cbt access

Revision ID: f970d191e423
Revises: 08dc46bbce5b
"""

from typing import Sequence, Union
import uuid

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "f970d191e423"
down_revision: Union[str, Sequence[str], None] = "08dc46bbce5b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    existing_columns = {
        column["name"]
        for column in inspector.get_columns(
            "ai_cbt_teacher_access"
        )
    }

    if "uuid" not in existing_columns:
        op.add_column(
            "ai_cbt_teacher_access",
            sa.Column(
                "uuid",
                postgresql.UUID(as_uuid=True),
                nullable=True,
            ),
        )

    if "created_at" not in existing_columns:
        op.add_column(
            "ai_cbt_teacher_access",
            sa.Column(
                "created_at",
                sa.DateTime(),
                nullable=True,
            ),
        )

    if "updated_at" not in existing_columns:
        op.add_column(
            "ai_cbt_teacher_access",
            sa.Column(
                "updated_at",
                sa.DateTime(),
                nullable=True,
            ),
        )

    inspector = sa.inspect(bind)

    columns = {
        column["name"]
        for column in inspector.get_columns(
            "ai_cbt_teacher_access"
        )
    }

    if "uuid" in columns:
        rows = bind.execute(
            sa.text(
                """
                SELECT id
                FROM ai_cbt_teacher_access
                WHERE uuid IS NULL
                """
            )
        ).fetchall()

        for row in rows:
            bind.execute(
                sa.text(
                    """
                    UPDATE ai_cbt_teacher_access
                    SET uuid = :uuid
                    WHERE id = :id
                    """
                ),
                {
                    "uuid": uuid.uuid4(),
                    "id": row.id,
                },
            )

    if "created_at" in columns:
        bind.execute(
            sa.text(
                """
                UPDATE ai_cbt_teacher_access
                SET created_at = CURRENT_TIMESTAMP
                WHERE created_at IS NULL
                """
            )
        )

    if "updated_at" in columns:
        bind.execute(
            sa.text(
                """
                UPDATE ai_cbt_teacher_access
                SET updated_at = CURRENT_TIMESTAMP
                WHERE updated_at IS NULL
                """
            )
        )

    inspector = sa.inspect(bind)

    indexes = {
        index["name"]
        for index in inspector.get_indexes(
            "ai_cbt_teacher_access"
        )
    }

    if "ix_ai_cbt_teacher_access_uuid" not in indexes:
        op.create_index(
            "ix_ai_cbt_teacher_access_uuid",
            "ai_cbt_teacher_access",
            ["uuid"],
            unique=False,
        )

    unique_constraints = {
        constraint["name"]
        for constraint in inspector.get_unique_constraints(
            "ai_cbt_teacher_access"
        )
        if constraint.get("name")
    }

    if "uq_ai_cbt_teacher_access_uuid" not in unique_constraints:
        op.create_unique_constraint(
            "uq_ai_cbt_teacher_access_uuid",
            "ai_cbt_teacher_access",
            ["uuid"],
        )

    op.alter_column(
        "ai_cbt_teacher_access",
        "uuid",
        existing_type=postgresql.UUID(as_uuid=True),
        nullable=False,
    )

    op.alter_column(
        "ai_cbt_teacher_access",
        "created_at",
        existing_type=sa.DateTime(),
        nullable=False,
    )

    op.alter_column(
        "ai_cbt_teacher_access",
        "updated_at",
        existing_type=sa.DateTime(),
        nullable=False,
    )


def downgrade() -> None:
    op.execute(
        sa.text(
            """
            ALTER TABLE ai_cbt_teacher_access
            DROP CONSTRAINT IF EXISTS
            uq_ai_cbt_teacher_access_uuid
            """
        )
    )

    op.execute(
        sa.text(
            """
            DROP INDEX IF EXISTS
            ix_ai_cbt_teacher_access_uuid
            """
        )
    )

    op.execute(
        sa.text(
            """
            ALTER TABLE ai_cbt_teacher_access
            DROP COLUMN IF EXISTS uuid
            """
        )
    )

    op.execute(
        sa.text(
            """
            ALTER TABLE ai_cbt_teacher_access
            DROP COLUMN IF EXISTS created_at
            """
        )
    )

    op.execute(
        sa.text(
            """
            ALTER TABLE ai_cbt_teacher_access
            DROP COLUMN IF EXISTS updated_at
            """
        )
    )
