"""add school id to students

Revision ID: ca243e09018b
Revises: ab04ea5faae7
Create Date: 2026-07-11 17:20:52.216661
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "ca243e09018b"
down_revision: Union[str, Sequence[str], None] = "ab04ea5faae7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add school_id temporarily as nullable so existing rows remain valid.
    op.add_column(
        "students",
        sa.Column(
            "school_id",
            sa.Integer(),
            nullable=True,
        ),
    )

    # 2. Backfill each student's school from the linked user account.
    op.execute(
        """
        UPDATE students
        SET school_id = users.school_id
        FROM users
        WHERE students.user_id = users.id
        """
    )

    # 3. After backfilling, school_id becomes required.
    op.alter_column(
        "students",
        "school_id",
        existing_type=sa.Integer(),
        nullable=False,
    )

    # 4. Add school index and foreign key.
    op.create_index(
        "ix_students_school_id",
        "students",
        ["school_id"],
        unique=False,
    )

    op.create_foreign_key(
        "fk_students_school_id_schools",
        "students",
        "schools",
        ["school_id"],
        ["id"],
        ondelete="CASCADE",
    )

    # 5. Replace globally unique admission number index
    # with a normal lookup index.
    op.drop_index(
        "ix_students_admission_number",
        table_name="students",
    )

    op.create_index(
        "ix_students_admission_number",
        "students",
        ["admission_number"],
        unique=False,
    )

    # 6. Admission number is unique only within each school.
    op.create_unique_constraint(
        "uq_students_school_admission_number",
        "students",
        ["school_id", "admission_number"],
    )


def downgrade() -> None:
    op.drop_constraint(
        "uq_students_school_admission_number",
        "students",
        type_="unique",
    )

    op.drop_index(
        "ix_students_admission_number",
        table_name="students",
    )

    op.create_index(
        "ix_students_admission_number",
        "students",
        ["admission_number"],
        unique=True,
    )

    op.drop_constraint(
        "fk_students_school_id_schools",
        "students",
        type_="foreignkey",
    )

    op.drop_index(
        "ix_students_school_id",
        table_name="students",
    )

    op.drop_column(
        "students",
        "school_id",
    )
