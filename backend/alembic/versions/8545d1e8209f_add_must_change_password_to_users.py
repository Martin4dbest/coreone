"""add must_change_password to users

Revision ID: 8545d1e8209f
Revises: 597e21f15b16
Create Date: 2026-07-27 01:08:21.474724

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8545d1e8209f'
down_revision: Union[str, Sequence[str], None] = '597e21f15b16'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
