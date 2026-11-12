"""Add school timetable publication tracking."""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "20261112_timetable_publication"
down_revision = "coreone_payslip_publishing"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "timetable_publications",
        sa.Column("school_id", sa.Integer(), nullable=False),
        sa.Column("academic_session_id", sa.Integer(), nullable=False),
        sa.Column("term_id", sa.Integer(), nullable=False),
        sa.Column(
            "publish_all_classes",
            sa.Boolean(),
            server_default=sa.false(),
            nullable=False,
        ),
        sa.Column(
            "published_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
        sa.Column("published_by", sa.Integer(), nullable=True),
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "uuid",
            postgresql.UUID(as_uuid=True),
            nullable=False,
            unique=True,
        ),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(
            ["school_id"], ["schools.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["academic_session_id"],
            ["academic_sessions.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["term_id"], ["terms.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["published_by"], ["users.id"], ondelete="SET NULL"
        ),
        sa.UniqueConstraint(
            "school_id",
            "academic_session_id",
            "term_id",
            name="uq_timetable_publication_school_session_term",
        ),
    )

    op.create_index(
        "ix_timetable_publications_id",
        "timetable_publications",
        ["id"],
    )
    op.create_index(
        "ix_timetable_publications_school_id",
        "timetable_publications",
        ["school_id"],
    )

    op.create_table(
        "timetable_publication_classes",
        sa.Column("school_id", sa.Integer(), nullable=False),
        sa.Column("publication_id", sa.Integer(), nullable=False),
        sa.Column("classroom_id", sa.Integer(), nullable=False),
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "uuid",
            postgresql.UUID(as_uuid=True),
            nullable=False,
            unique=True,
        ),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(
            ["school_id"], ["schools.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["publication_id"],
            ["timetable_publications.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["classroom_id"], ["classrooms.id"], ondelete="CASCADE"
        ),
        sa.UniqueConstraint(
            "publication_id",
            "classroom_id",
            name="uq_timetable_publication_class",
        ),
    )

    op.create_index(
        "ix_timetable_publication_classes_id",
        "timetable_publication_classes",
        ["id"],
    )
    op.create_index(
        "ix_timetable_publication_classes_school_id",
        "timetable_publication_classes",
        ["school_id"],
    )


def downgrade():
    op.drop_table("timetable_publication_classes")
    op.drop_table("timetable_publications")
