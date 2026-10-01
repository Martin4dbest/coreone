"""create CoreOne timetable

Revision ID: coreone_timetable_20261001
Revises: coreone_staff_attendance_address_20260919150000
"""

from alembic import op
import sqlalchemy as sa


revision = "coreone_timetable_20261001"
down_revision = "coreone_staff_attendance_address_20260919150000"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "timetable_entries",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "school_id",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "academic_session_id",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "term_id",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "classroom_id",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "subject_id",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "teacher_id",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "day_of_week",
            sa.String(20),
            nullable=False,
        ),
        sa.Column(
            "start_time",
            sa.Time(),
            nullable=False,
        ),
        sa.Column(
            "end_time",
            sa.Time(),
            nullable=False,
        ),
        sa.Column(
            "is_active",
            sa.Boolean(),
            nullable=False,
            server_default=sa.true(),
        ),
        sa.Column(
            "uuid",
            sa.UUID(),
            nullable=False,
            unique=True,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=True,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(),
            nullable=True,
        ),
        sa.ForeignKeyConstraint(
            ["school_id"],
            ["schools.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["academic_session_id"],
            ["academic_sessions.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["term_id"],
            ["terms.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["classroom_id"],
            ["classrooms.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["subject_id"],
            ["subjects.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["teacher_id"],
            ["teachers.id"],
            ondelete="CASCADE",
        ),
    )

    op.create_index(
        "ix_timetable_entries_school_id",
        "timetable_entries",
        ["school_id"],
    )

    op.create_index(
        "ix_timetable_entries_academic_session_id",
        "timetable_entries",
        ["academic_session_id"],
    )

    op.create_index(
        "ix_timetable_entries_term_id",
        "timetable_entries",
        ["term_id"],
    )

    op.create_index(
        "ix_timetable_entries_classroom_id",
        "timetable_entries",
        ["classroom_id"],
    )

    op.create_index(
        "ix_timetable_entries_subject_id",
        "timetable_entries",
        ["subject_id"],
    )

    op.create_index(
        "ix_timetable_entries_teacher_id",
        "timetable_entries",
        ["teacher_id"],
    )

    op.create_index(
        "ix_timetable_entries_day_of_week",
        "timetable_entries",
        ["day_of_week"],
    )

    op.create_index(
        "ix_timetable_entries_is_active",
        "timetable_entries",
        ["is_active"],
    )


def downgrade():
    op.drop_index(
        "ix_timetable_entries_is_active",
        table_name="timetable_entries",
    )
    op.drop_index(
        "ix_timetable_entries_day_of_week",
        table_name="timetable_entries",
    )
    op.drop_index(
        "ix_timetable_entries_teacher_id",
        table_name="timetable_entries",
    )
    op.drop_index(
        "ix_timetable_entries_subject_id",
        table_name="timetable_entries",
    )
    op.drop_index(
        "ix_timetable_entries_classroom_id",
        table_name="timetable_entries",
    )
    op.drop_index(
        "ix_timetable_entries_term_id",
        table_name="timetable_entries",
    )
    op.drop_index(
        "ix_timetable_entries_academic_session_id",
        table_name="timetable_entries",
    )
    op.drop_index(
        "ix_timetable_entries_school_id",
        table_name="timetable_entries",
    )
    op.drop_table("timetable_entries")
