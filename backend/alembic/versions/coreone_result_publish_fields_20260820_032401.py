"""CoreOne result publishing fields

Revision ID: coreone_result_publish_20260820_032401
"""

from alembic import op
import sqlalchemy as sa


revision = "coreone_result_publish_20260820_032401"
down_revision = "repair_notifications_20260815"
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    columns = {
        col["name"]
        for col in inspector.get_columns("results")
    }

    if "is_published" not in columns:
        op.add_column(
            "results",
            sa.Column(
                "is_published",
                sa.Boolean(),
                nullable=False,
                server_default=sa.text("false"),
            ),
        )

    if "published_at" not in columns:
        op.add_column(
            "results",
            sa.Column(
                "published_at",
                sa.DateTime(),
                nullable=True,
            ),
        )


def downgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    columns = {
        col["name"]
        for col in inspector.get_columns("results")
    }

    if "published_at" in columns:
        op.drop_column("results", "published_at")

    if "is_published" in columns:
        op.drop_column("results", "is_published")
