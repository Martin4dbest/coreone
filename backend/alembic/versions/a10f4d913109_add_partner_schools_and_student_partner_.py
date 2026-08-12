"""add partner schools and student partner associations

Revision ID: a10f4d913109
Revises: 7f3a91c2d4e5
Create Date: 2026-08-12 02:07:01.801731

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "a10f4d913109"
down_revision: Union[str, Sequence[str], None] = "7f3a91c2d4e5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create partner schools and student partner associations."""

    op.create_table(
        "partner_schools",
        sa.Column(
            "id",
            sa.Integer(),
            primary_key=True,
            nullable=False,
        ),
        sa.Column(
            "school_id",
            sa.Integer(),
            sa.ForeignKey(
                "schools.id",
                ondelete="CASCADE",
            ),
            nullable=False,
        ),
        sa.Column(
            "name",
            sa.String(length=255),
            nullable=False,
        ),
        sa.Column(
            "is_active",
            sa.Boolean(),
            nullable=False,
            server_default=sa.true(),
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )

    op.create_index(
        "ix_partner_schools_id",
        "partner_schools",
        ["id"],
        unique=False,
    )

    op.create_index(
        "ix_partner_schools_school_id",
        "partner_schools",
        ["school_id"],
        unique=False,
    )

    op.create_table(
        "student_partner_schools",
        sa.Column(
            "id",
            sa.Integer(),
            primary_key=True,
            nullable=False,
        ),
        sa.Column(
            "student_id",
            sa.Integer(),
            sa.ForeignKey(
                "students.id",
                ondelete="CASCADE",
            ),
            nullable=False,
        ),
        sa.Column(
            "partner_school_id",
            sa.Integer(),
            sa.ForeignKey(
                "partner_schools.id",
                ondelete="CASCADE",
            ),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.UniqueConstraint(
            "student_id",
            "partner_school_id",
            name="uq_student_partner_school",
        ),
    )

    op.create_index(
        "ix_student_partner_schools_id",
        "student_partner_schools",
        ["id"],
        unique=False,
    )

    op.create_index(
        "ix_student_partner_schools_student_id",
        "student_partner_schools",
        ["student_id"],
        unique=False,
    )

    op.create_index(
        "ix_student_partner_schools_partner_school_id",
        "student_partner_schools",
        ["partner_school_id"],
        unique=False,
    )


def downgrade() -> None:
    """Remove partner schools and student partner associations."""

    op.drop_index(
        "ix_student_partner_schools_partner_school_id",
        table_name="student_partner_schools",
    )

    op.drop_index(
        "ix_student_partner_schools_student_id",
        table_name="student_partner_schools",
    )

    op.drop_index(
        "ix_student_partner_schools_id",
        table_name="student_partner_schools",
    )

    op.drop_table("student_partner_schools")

    op.drop_index(
        "ix_partner_schools_school_id",
        table_name="partner_schools",
    )

    op.drop_index(
        "ix_partner_schools_id",
        table_name="partner_schools",
    )

    op.drop_table("partner_schools")
