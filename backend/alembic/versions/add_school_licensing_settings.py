"""add school licensing settings"""

from alembic import op
import sqlalchemy as sa


# REPLACE THIS WITH THE VALUE FROM:
# alembic heads

revision = "9c4f7a21d8e3"
down_revision = "87569785330a"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "school_licensing",
        sa.Column(
            "id",
            sa.Integer(),
            primary_key=True,
            nullable=False,
        ),
        sa.Column(
            "school_id",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "super_admin_price",
            sa.Integer(),
            nullable=False,
            server_default="5000",
        ),
        sa.Column(
            "admin_price",
            sa.Integer(),
            nullable=False,
            server_default="5000",
        ),
        sa.Column(
            "teacher_price",
            sa.Integer(),
            nullable=False,
            server_default="2000",
        ),
        sa.Column(
            "student_price",
            sa.Integer(),
            nullable=False,
            server_default="1000",
        ),
        sa.Column(
            "parent_price",
            sa.Integer(),
            nullable=False,
            server_default="500",
        ),
        sa.Column(
            "staff_price",
            sa.Integer(),
            nullable=False,
            server_default="1000",
        ),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=True,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(),
            nullable=True,
            server_default=sa.func.now(),
        ),
        sa.ForeignKeyConstraint(
            ["school_id"],
            ["schools.id"],
            ondelete="CASCADE",
            name="fk_school_licensing_school_id",
        ),
        sa.UniqueConstraint(
            "school_id",
            name="uq_school_licensing_school_id",
        ),
    )

    op.create_index(
        "ix_school_licensing_id",
        "school_licensing",
        ["id"],
        unique=False,
    )

    op.create_index(
        "ix_school_licensing_school_id",
        "school_licensing",
        ["school_id"],
        unique=True,
    )

    # Initialize every existing school with the current
    # CoreOne default pricing.
    op.execute(
        """
        INSERT INTO school_licensing (
            school_id,
            super_admin_price,
            admin_price,
            teacher_price,
            student_price,
            parent_price,
            staff_price
        )
        SELECT
            s.id,
            5000,
            5000,
            2000,
            1000,
            500,
            1000
        FROM schools s
        """
    )


def downgrade():
    op.drop_index(
        "ix_school_licensing_school_id",
        table_name="school_licensing",
    )

    op.drop_index(
        "ix_school_licensing_id",
        table_name="school_licensing",
    )

    op.drop_table("school_licensing")
