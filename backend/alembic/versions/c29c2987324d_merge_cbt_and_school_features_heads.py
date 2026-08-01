"""merge cbt and school features heads

Revision ID: c29c2987324d
Revises: create_school_features_table, b7c9d2e4f111
Create Date: 2026-07-31 02:17:16.442135

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c29c2987324d'
down_revision: Union[str, Sequence[str], None] = ('create_school_features_table', 'b7c9d2e4f111')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
