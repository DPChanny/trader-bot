import asyncio

from alembic import context
from shared.entities import BaseEntity
from shared.utils.db import get_engine


async def main() -> None:
    engine = get_engine()
    async with engine.connect() as connection:
        context.configure(connection=connection, target_metadata=BaseEntity.metadata)
        with context.begin_transaction():
            context.run_migrations()
    await engine.dispose()


asyncio.run(main())
