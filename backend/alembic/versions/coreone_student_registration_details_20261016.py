"""Add residential and parent/guardian details to students."""

from alembic import op
import sqlalchemy as sa

revision = "coreone_student_registration_details_20261016"
down_revision = "coreone_merge_admissions_staff_20261015"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("students", sa.Column("lga", sa.String(100), nullable=True))
    op.add_column("students", sa.Column("state", sa.String(100), nullable=True))
    op.add_column("students", sa.Column("country", sa.String(100), nullable=True))
    op.add_column("students", sa.Column("address", sa.String(500), nullable=True))
    op.add_column(
        "students",
        sa.Column("parent_guardian_name", sa.String(200), nullable=True),
    )
    op.add_column(
        "students",
        sa.Column("parent_guardian_phone", sa.String(30), nullable=True),
    )


def downgrade():
    op.drop_column("students", "parent_guardian_phone")
    op.drop_column("students", "parent_guardian_name")
    op.drop_column("students", "address")
    op.drop_column("students", "country")
    op.drop_column("students", "state")
    op.drop_column("students", "lga")
