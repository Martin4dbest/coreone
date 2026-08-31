"""reset school licensing defaults to zero"""

from alembic import op


revision = "c72a91f04e6b"
down_revision = "f1a7c93d52b8"
branch_labels = None
depends_on = None


def upgrade():
    op.execute(
        """
        UPDATE school_licensing
        SET
            super_admin_price = 0,
            admin_price = 0,
            teacher_price = 0,
            student_price = 0,
            parent_price = 0,
            staff_price = 0
        """
    )


def downgrade():
    op.execute(
        """
        UPDATE school_licensing
        SET
            super_admin_price = 5000,
            admin_price = 5000,
            teacher_price = 2000,
            student_price = 1000,
            parent_price = 500,
            staff_price = 1000
        """
    )
