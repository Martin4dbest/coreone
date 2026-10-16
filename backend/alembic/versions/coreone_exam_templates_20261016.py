"""Create school examination template centre."""

from alembic import op
import sqlalchemy as sa

revision = "coreone_exam_templates_20261016"
down_revision = "coreone_student_registration_details_20261016"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "exam_templates",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("uuid", sa.UUID(), nullable=False, unique=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column(
            "school_id",
            sa.Integer(),
            sa.ForeignKey("schools.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("assessment_type", sa.String(20), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("class_name", sa.String(100), nullable=True),
        sa.Column("subject", sa.String(150), nullable=True),
        sa.Column("file_url", sa.String(1000), nullable=False),
        sa.Column("cloudinary_public_id", sa.String(500), nullable=False),
        sa.Column("original_filename", sa.String(255), nullable=False),
        sa.Column("content_type", sa.String(150), nullable=False),
        sa.Column("file_size", sa.Integer(), nullable=False),
        sa.Column("version", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column(
            "uploaded_by",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="RESTRICT"),
            nullable=False,
        ),
    )
    op.create_index(
        "ix_exam_templates_school_id", "exam_templates", ["school_id"]
    )


def downgrade():
    op.drop_index("ix_exam_templates_school_id", table_name="exam_templates")
    op.drop_table("exam_templates")
