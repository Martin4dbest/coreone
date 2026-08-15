"""add primary school admin flag

Revision ID: add_primary_school_admin
Revises: 652b22c7e82a
Create Date: 2026-08-15
"""

from alembic import op
import sqlalchemy as sa


revision = "add_primary_school_admin"
down_revision = "652b22c7e82a"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "users",
        sa.Column(
            "is_primary_school_admin",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )

    # Existing schools:
    # mark the earliest SCHOOL_ADMIN account in each school
    # as the primary School Admin.
    op.execute(
        sa.text(
            """
            UPDATE users AS u
            SET is_primary_school_admin = TRUE
            FROM (
                SELECT MIN(u2.id) AS first_admin_id
                FROM users AS u2
                JOIN roles AS r
                  ON r.id = u2.role_id
                WHERE r.name = 'SCHOOL_ADMIN'
                GROUP BY u2.school_id
            ) AS first_admin
            WHERE u.id = first_admin.first_admin_id
            """
        )
    )

    op.alter_column(
        "users",
        "is_primary_school_admin",
        server_default=None,
    )


def downgrade():
    op.drop_column(
        "users",
        "is_primary_school_admin",
    )
