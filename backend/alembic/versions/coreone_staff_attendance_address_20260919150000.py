"""add staff attendance human-readable locations

Revision ID: coreone_staff_attendance_address_20260919150000
Revises: coreone_staff_geofence_20260919120904
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "coreone_staff_attendance_address_20260919150000"
down_revision: Union[str, None] = "coreone_staff_geofence_20260919120904"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "schools",
        sa.Column(
            "staff_attendance_location_name",
            sa.String(length=500),
            nullable=True,
        ),
    )

    op.add_column(
        "staff_attendance",
        sa.Column(
            "check_in_location_name",
            sa.String(length=500),
            nullable=True,
        ),
    )


def downgrade() -> None:
    op.drop_column(
        "staff_attendance",
        "check_in_location_name",
    )

    op.drop_column(
        "schools",
        "staff_attendance_location_name",
    )
