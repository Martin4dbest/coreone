"""add video url to cbt questions

Revision ID: 652b22c7e82a
Revises: a10f4d913109
Create Date: 2026-08-13
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "652b22c7e82a"
down_revision: Union[str, Sequence[str], None] = "a10f4d913109"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "cbt_questions",
        sa.Column(
            "video_url",
            sa.String(length=1000),
            nullable=True,
        ),
    )


def downgrade() -> None:
    op.drop_column(
        "cbt_questions",
        "video_url",
    )
