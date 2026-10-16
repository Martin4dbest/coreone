"""Add admissions and student lifecycle history."""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "coreone_admissions_lifecycle_20261015"
down_revision = "coreone_timetable_20261001"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "students",
        sa.Column(
            "lifecycle_status",
            sa.String(length=30),
            nullable=False,
            server_default="ACTIVE",
        ),
    )
    op.add_column(
        "students",
        sa.Column("current_academic_session_id", sa.Integer(), nullable=True),
    )
    op.create_index(
        "ix_students_current_academic_session_id",
        "students",
        ["current_academic_session_id"],
    )
    op.create_foreign_key(
        "fk_students_current_academic_session_id",
        "students",
        "academic_sessions",
        ["current_academic_session_id"],
        ["id"],
        ondelete="SET NULL",
    )

    op.create_table(
        "student_lifecycle_history",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "uuid",
            postgresql.UUID(as_uuid=True),
            nullable=False,
            unique=True,
        ),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("school_id", sa.Integer(), nullable=False),
        sa.Column("student_id", sa.Integer(), nullable=False),
        sa.Column("action", sa.String(length=40), nullable=False),
        sa.Column("previous_classroom_id", sa.Integer(), nullable=True),
        sa.Column("new_classroom_id", sa.Integer(), nullable=True),
        sa.Column("previous_session_id", sa.Integer(), nullable=True),
        sa.Column("new_session_id", sa.Integer(), nullable=True),
        sa.Column("previous_status", sa.String(length=30), nullable=True),
        sa.Column("new_status", sa.String(length=30), nullable=True),
        sa.Column("performed_by", sa.Integer(), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(
            ["school_id"], ["schools.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["student_id"], ["students.id"], ondelete="RESTRICT"
        ),
        sa.ForeignKeyConstraint(
            ["previous_classroom_id"], ["classrooms.id"], ondelete="SET NULL"
        ),
        sa.ForeignKeyConstraint(
            ["new_classroom_id"], ["classrooms.id"], ondelete="SET NULL"
        ),
        sa.ForeignKeyConstraint(
            ["previous_session_id"], ["academic_sessions.id"], ondelete="SET NULL"
        ),
        sa.ForeignKeyConstraint(
            ["new_session_id"], ["academic_sessions.id"], ondelete="SET NULL"
        ),
        sa.ForeignKeyConstraint(
            ["performed_by"], ["users.id"], ondelete="RESTRICT"
        ),
    )
    op.create_index(
        "ix_student_lifecycle_history_student_id",
        "student_lifecycle_history",
        ["student_id"],
    )
    op.create_index(
        "ix_student_lifecycle_history_school_id",
        "student_lifecycle_history",
        ["school_id"],
    )


def downgrade():
    op.drop_index(
        "ix_student_lifecycle_history_school_id",
        table_name="student_lifecycle_history",
    )
    op.drop_index(
        "ix_student_lifecycle_history_student_id",
        table_name="student_lifecycle_history",
    )
    op.drop_table("student_lifecycle_history")
    op.drop_constraint(
        "fk_students_current_academic_session_id",
        "students",
        type_="foreignkey",
    )
    op.drop_index(
        "ix_students_current_academic_session_id",
        table_name="students",
    )
    op.drop_column("students", "current_academic_session_id")
    op.drop_column("students", "lifecycle_status")
