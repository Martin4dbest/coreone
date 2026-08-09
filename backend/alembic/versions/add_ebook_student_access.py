"""add ebook student access

Revision ID: add_ebook_student_access
Revises: d88b25d7ef16, add_ebook_publish_control
"""

from alembic import op
import sqlalchemy as sa


revision = "add_ebook_student_access"
down_revision = (
    "d88b25d7ef16",
    "add_ebook_publish_control",
)
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "ebook_student_access",
        sa.Column(
            "id",
            sa.Integer(),
            primary_key=True,
        ),
        sa.Column(
            "ebook_id",
            sa.Integer(),
            sa.ForeignKey(
                "ebooks.id",
                ondelete="CASCADE",
            ),
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
            "school_id",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "is_active",
            sa.Boolean(),
            nullable=False,
            server_default=sa.true(),
        ),
        sa.Column(
            "granted_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "granted_by",
            sa.Integer(),
            nullable=True,
        ),
        sa.UniqueConstraint(
            "ebook_id",
            "student_id",
            name="uq_ebook_student_access_ebook_student",
        ),
    )

    op.create_index(
        "ix_ebook_student_access_ebook_id",
        "ebook_student_access",
        ["ebook_id"],
    )

    op.create_index(
        "ix_ebook_student_access_student_id",
        "ebook_student_access",
        ["student_id"],
    )

    op.create_index(
        "ix_ebook_student_access_school_id",
        "ebook_student_access",
        ["school_id"],
    )


def downgrade():
    op.drop_index(
        "ix_ebook_student_access_school_id",
        table_name="ebook_student_access",
    )

    op.drop_index(
        "ix_ebook_student_access_student_id",
        table_name="ebook_student_access",
    )

    op.drop_index(
        "ix_ebook_student_access_ebook_id",
        table_name="ebook_student_access",
    )

    op.drop_table("ebook_student_access")
