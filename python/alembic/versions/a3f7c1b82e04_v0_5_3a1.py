"""
Revision: a3f7c1b82e04
Version: v0_5_3a1
Parent: 98d2449808d5
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op


revision: str = "a3f7c1b82e04"
down_revision: str | Sequence[str] | None = "98d2449808d5"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "subscription", sa.Column("next_plan", sa.SmallInteger(), nullable=True)
    )


def downgrade() -> None:
    op.drop_column("subscription", "next_plan")
