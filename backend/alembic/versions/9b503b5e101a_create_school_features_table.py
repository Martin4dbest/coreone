"""create_school_features_table"""

from alembic import op
import sqlalchemy as sa

revision = "create_school_features_table"
down_revision = "f2a9251d5336"
branch_labels = None
depends_on = None


def upgrade():

    op.create_table(
        "school_features",

        sa.Column(
            "id",
            sa.Integer(),
            primary_key=True,
        ),

        sa.Column(
            "school_id",
            sa.Integer(),
            sa.ForeignKey(
                "schools.id",
                ondelete="CASCADE",
            ),
            nullable=False,
        ),

        sa.Column(
            "feature_key",
            sa.String(length=100),
            nullable=False,
        ),

        sa.Column(
            "enabled",
            sa.Boolean(),
            nullable=False,
            server_default=sa.true(),
        ),

        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
        ),

        sa.Column(
            "updated_at",
            sa.DateTime(),
            nullable=False,
        ),
    )

    op.create_index(
        "ix_school_features_school_id",
        "school_features",
        ["school_id"],
    )

    op.create_index(
        "ix_school_features_feature_key",
        "school_features",
        ["feature_key"],
    )

    op.create_unique_constraint(
        "uq_school_feature",
        "school_features",
        ["school_id", "feature_key"],
    )


def downgrade():

    op.drop_table("school_features")
