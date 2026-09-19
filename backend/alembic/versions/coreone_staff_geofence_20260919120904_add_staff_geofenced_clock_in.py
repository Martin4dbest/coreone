"""add staff geofenced clock in

Revision ID: coreone_staff_geofence_20260919120904
Revises: 4c260aab48db
"""

from alembic import op
import sqlalchemy as sa


revision = "coreone_staff_geofence_20260919120904"
down_revision = "4c260aab48db"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "schools",
        sa.Column(
            "staff_attendance_latitude",
            sa.Float(),
            nullable=True,
        ),
    )

    op.add_column(
        "schools",
        sa.Column(
            "staff_attendance_longitude",
            sa.Float(),
            nullable=True,
        ),
    )

    op.add_column(
        "schools",
        sa.Column(
            "staff_attendance_radius_meters",
            sa.Float(),
            nullable=False,
            server_default="100",
        ),
    )

    op.add_column(
        "staff_attendance",
        sa.Column(
            "check_in_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
    )

    op.add_column(
        "staff_attendance",
        sa.Column(
            "check_in_latitude",
            sa.Float(),
            nullable=True,
        ),
    )

    op.add_column(
        "staff_attendance",
        sa.Column(
            "check_in_longitude",
            sa.Float(),
            nullable=True,
        ),
    )

    op.add_column(
        "staff_attendance",
        sa.Column(
            "check_in_accuracy",
            sa.Float(),
            nullable=True,
        ),
    )

    op.add_column(
        "staff_attendance",
        sa.Column(
            "check_in_distance_meters",
            sa.Float(),
            nullable=True,
        ),
    )

    op.add_column(
        "staff_attendance",
        sa.Column(
            "check_in_mocked",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )


def downgrade():
    op.drop_column(
        "staff_attendance",
        "check_in_mocked",
    )
    op.drop_column(
        "staff_attendance",
        "check_in_distance_meters",
    )
    op.drop_column(
        "staff_attendance",
        "check_in_accuracy",
    )
    op.drop_column(
        "staff_attendance",
        "check_in_longitude",
    )
    op.drop_column(
        "staff_attendance",
        "check_in_latitude",
    )
    op.drop_column(
        "staff_attendance",
        "check_in_at",
    )

    op.drop_column(
        "schools",
        "staff_attendance_radius_meters",
    )
    op.drop_column(
        "schools",
        "staff_attendance_longitude",
    )
    op.drop_column(
        "schools",
        "staff_attendance_latitude",
    )
