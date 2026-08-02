"""add cbt provider fields

Revision ID: e224c119f3bb
Revises: 1e493c7d4c62
Create Date: 2026-08-01 11:29:15.029629

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e224c119f3bb'
down_revision: Union[str, Sequence[str], None] = '1e493c7d4c62'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
