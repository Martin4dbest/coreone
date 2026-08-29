"""add parent school memberships

Revision ID: 0e115f22ebc8
Revises: 67cb5767af36
Create Date: 2026-08-29 15:29:34.650098

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0e115f22ebc8'
down_revision: Union[str, Sequence[str], None] = '67cb5767af36'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
