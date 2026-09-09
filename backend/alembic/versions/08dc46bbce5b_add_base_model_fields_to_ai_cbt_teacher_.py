"""add base model fields to ai cbt teacher access

Revision ID: 08dc46bbce5b
Revises: e20ea3193df7
Create Date: 2026-09-09 07:32:44.192561

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "08dc46bbce5b"
down_revision: Union[str, Sequence[str], None] = "e20ea3193df7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
