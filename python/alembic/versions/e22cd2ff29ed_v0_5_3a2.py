"""
Revision: e22cd2ff29ed
Version: v0_5_3a2
Parent: a3f7c1b82e04
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op


revision: str = "e22cd2ff29ed"
down_revision: str | Sequence[str] | None = "a3f7c1b82e04"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "user",
        sa.Column(
            "customer_key",
            sa.String(length=36),
            server_default=sa.text("gen_random_uuid()::text"),
            nullable=False,
        ),
    )
    op.create_unique_constraint("uq_user_customer_key", "user", ["customer_key"])


def downgrade() -> None:
    op.drop_constraint("uq_user_customer_key", "user", type_="unique")
    op.drop_column("user", "customer_key")
