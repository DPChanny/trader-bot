import asyncio

from alembic import context
from shared.entities import BaseEntity
from shared.utils.db import get_engine


def do_run_migrations(connection) -> None:
    context.configure(connection=connection, target_metadata=BaseEntity.metadata)
    with context.begin_transaction():
        context.run_migrations()


async def main() -> None:
    engine = get_engine()
    async with engine.connect() as connection:
        await connection.run_sync(do_run_migrations)


asyncio.run(main())
