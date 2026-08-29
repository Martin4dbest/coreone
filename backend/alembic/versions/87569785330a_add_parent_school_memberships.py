"""add parent school memberships

Revision ID: 87569785330a
Revises: 0e115f22ebc8
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "87569785330a"
down_revision = "0e115f22ebc8"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "parent_schools",
        sa.Column(
            "id",
            sa.Integer(),
            primary_key=True,
            nullable=False,
        ),
        sa.Column(
            "parent_id",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "school_id",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["parent_id"],
            ["parents.id"],
            name="fk_parent_schools_parent_id",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["school_id"],
            ["schools.id"],
            name="fk_parent_schools_school_id",
            ondelete="CASCADE",
        ),
        sa.UniqueConstraint(
            "parent_id",
            "school_id",
            name="uq_parent_school",
        ),
    )

    op.create_index(
        "ix_parent_schools_id",
        "parent_schools",
        ["id"],
        unique=False,
    )

    op.create_index(
        "ix_parent_schools_parent_id",
        "parent_schools",
        ["parent_id"],
        unique=False,
    )

    op.create_index(
        "ix_parent_schools_school_id",
        "parent_schools",
        ["school_id"],
        unique=False,
    )

    # --------------------------------------------------------
    # BACKFILL EXISTING PARENT/STUDENT RELATIONSHIPS
    #
    # If a parent is already linked to a student, that parent
    # must also become a registered parent of that student's
    # school.
    # --------------------------------------------------------

    op.execute(
        """
        INSERT INTO parent_schools (
            parent_id,
            school_id
        )
        SELECT DISTINCT
            ps.parent_id,
            s.school_id
        FROM parent_students ps
        JOIN students s
            ON s.id = ps.student_id
        WHERE NOT EXISTS (
            SELECT 1
            FROM parent_schools existing
            WHERE existing.parent_id = ps.parent_id
              AND existing.school_id = s.school_id
        )
        """
    )


def downgrade() -> None:
    op.drop_index(
        "ix_parent_schools_school_id",
        table_name="parent_schools",
    )

    op.drop_index(
        "ix_parent_schools_parent_id",
        table_name="parent_schools",
    )

    op.drop_index(
        "ix_parent_schools_id",
        table_name="parent_schools",
    )

    op.drop_table("parent_schools")
