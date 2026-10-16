"""add school staff reporting time"""

from alembic import op
import sqlalchemy as sa


revision = "coreone_staff_reporting_time_20261002"
down_revision = "coreone_timetable_20261001"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "schools",
        sa.Column(
            "staff_reporting_time",
            sa.Time(),
            nullable=False,
            server_default=sa.text("'08:00:00'"),
        ),
    )


def downgrade():
    op.drop_column(
        "schools",
        "staff_reporting_time",
    )
