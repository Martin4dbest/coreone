"""add published to youtube learning

Revision ID: 282acb432a9a
Revises: add_youtube_activity
Create Date: 2026-08-09 19:03:31.018968
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "282acb432a9a"
down_revision: Union[str, Sequence[str], None] = "add_youtube_activity"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "youtube_learning",
        sa.Column(
            "published",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("true"),
        ),
    )


def downgrade() -> None:
    op.drop_column(
        "youtube_learning",
        "published",
    )
