import asyncio

from loguru import logger
from sqlalchemy import select

from shared.entities.member import Member
from shared.utils.database import get_db, setup_db
from shared.utils.logging import setup_logging

from .services.lol_stat_service import crawl_lol_stat, save_lol_stat_to_db
from .services.val_stat_service import crawl_val_stat, save_val_stat_to_db
from .utils import close_driver, create_driver


setup_logging()

MAX_WORKERS = 4
_semaphore: asyncio.Semaphore | None = None


def _sync_crawl(member_id: int, game_name: str, tag_line: str) -> tuple:
    lol_stat_dto = None
    val_stat_dto = None

    lol_driver = None
    try:
        lol_driver = create_driver()
        lol_stat_dto = crawl_lol_stat(lol_driver, game_name, tag_line)
    except Exception as e:
        logger.error(f"LOL stat crawl failed for {member_id}: {type(e).__name__}: {e}")
    finally:
        close_driver(lol_driver)

    val_driver = None
    try:
        val_driver = create_driver()
        val_stat_dto = crawl_val_stat(val_driver, game_name, tag_line)
    except Exception as e:
        logger.error(f"VAL stat crawl failed for {member_id}: {type(e).__name__}: {e}")
    finally:
        close_driver(val_driver)

    return lol_stat_dto, val_stat_dto


async def crawl_member(member_id: int, game_name: str, tag_line: str) -> bool:
    async with _semaphore:
        logger.info(f"Starting crawl: member_id={member_id}, {game_name}#{tag_line}")
        lol_stat_dto, val_stat_dto = await asyncio.to_thread(
            _sync_crawl, member_id, game_name, tag_line
        )

    try:
        async for db in get_db():
            if lol_stat_dto is not None:
                await save_lol_stat_to_db(member_id, lol_stat_dto, db)
            if val_stat_dto is not None:
                await save_val_stat_to_db(member_id, val_stat_dto, db)
            await db.commit()
        logger.info(f"Finished crawl: member_id={member_id}")
        return True
    except Exception as e:
        logger.error(f"DB save failed for {member_id}: {e}")
        return False


async def main():
    global _semaphore
    _semaphore = asyncio.Semaphore(MAX_WORKERS)

    logger.info("=== Crawler Starting ===")

    await setup_db()

    async for db in get_db():
        result = await db.execute(select(Member).where(Member.riot_id.isnot(None)))
        members = result.scalars().all()

    crawl_tasks = [
        (member.member_id, game_name, tag_line)
        for member in members
        if member.riot_id and "#" in member.riot_id
        for game_name, tag_line in [member.riot_id.split("#", 1)]
    ]

    logger.info(f"Found {len(crawl_tasks)} members to crawl")

    if not crawl_tasks:
        logger.info("No members to crawl. Exiting.")
        return

    results = await asyncio.gather(
        *[crawl_member(mid, gn, tl) for mid, gn, tl in crawl_tasks]
    )

    success_count = sum(results)
    fail_count = len(results) - success_count
    logger.info(
        f"=== Crawler Finished === Success: {success_count}, Failed: {fail_count}, Total: {len(crawl_tasks)}"
    )


if __name__ == "__main__":
    asyncio.run(main())
