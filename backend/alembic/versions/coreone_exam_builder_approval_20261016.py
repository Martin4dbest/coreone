"""Create standalone exam builder and approval centre."""

from alembic import op
import sqlalchemy as sa

revision = "coreone_exam_builder_approval_20261016"
down_revision = "coreone_exam_templates_20261016"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "exam_papers",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("uuid", sa.UUID(), nullable=False, unique=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("school_id", sa.Integer(), sa.ForeignKey("schools.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("subject", sa.String(150), nullable=False),
        sa.Column("class_name", sa.String(100), nullable=False),
        sa.Column("instructions", sa.Text(), nullable=True),
        sa.Column("sections", sa.JSON(), nullable=False),
        sa.Column("total_marks", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("status", sa.String(20), nullable=False, server_default="DRAFT"),
        sa.Column("created_by", sa.Integer(), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
    )
    op.create_index("ix_exam_papers_school_id", "exam_papers", ["school_id"])
    op.create_index("ix_exam_papers_status", "exam_papers", ["status"])

    op.create_table(
        "exam_paper_reviews",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("uuid", sa.UUID(), nullable=False, unique=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("paper_id", sa.Integer(), sa.ForeignKey("exam_papers.id", ondelete="CASCADE"), nullable=False),
        sa.Column("school_id", sa.Integer(), sa.ForeignKey("schools.id", ondelete="CASCADE"), nullable=False),
        sa.Column("reviewer_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("decision", sa.String(20), nullable=False),
        sa.Column("feedback", sa.Text(), nullable=True),
    )
    op.create_index("ix_exam_paper_reviews_paper_id", "exam_paper_reviews", ["paper_id"])
    op.create_index("ix_exam_paper_reviews_school_id", "exam_paper_reviews", ["school_id"])


def downgrade():
    op.drop_index("ix_exam_paper_reviews_school_id", table_name="exam_paper_reviews")
    op.drop_index("ix_exam_paper_reviews_paper_id", table_name="exam_paper_reviews")
    op.drop_table("exam_paper_reviews")
    op.drop_index("ix_exam_papers_status", table_name="exam_papers")
    op.drop_index("ix_exam_papers_school_id", table_name="exam_papers")
    op.drop_table("exam_papers")
