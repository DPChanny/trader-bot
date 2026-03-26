from concurrent.futures import ThreadPoolExecutor, as_completed

from loguru import logger

from shared.entities.member import Member
from shared.utils.database import setup_db
from shared.utils.logging import setup_logging

from .services.lol_stat_service import crawl_lol_stat, save_lol_stat_to_db
from .services.val_stat_service import crawl_val_stat, save_val_stat_to_db
from .utils import close_driver, create_driver, session_context


setup_logging()

MAX_WORKERS = 4


def crawl_member(member_id: int, game_name: str, tag_line: str):
    lol_driver = None
    val_driver = None
    try:
        logger.info(f"Starting crawl for member {member_id}: {game_name}#{tag_line}")

        try:
            lol_driver = create_driver()
            lol_stat_dto = crawl_lol_stat(lol_driver, game_name, tag_line)
            save_lol_stat_to_db(member_id, lol_stat_dto)
        except Exception as e:
            logger.error(
                f"LOL stat crawl failed for {member_id}: {type(e).__name__}: {str(e)}"
            )
        finally:
            close_driver(lol_driver)

        try:
            val_driver = create_driver()
            val_stat_dto = crawl_val_stat(val_driver, game_name, tag_line)
            save_val_stat_to_db(member_id, val_stat_dto)
        except Exception as e:
            logger.error(
                f"VAL stat crawl failed for {member_id}: {type(e).__name__}: {str(e)}"
            )
        finally:
            close_driver(val_driver)

        logger.info(f"Finished crawl for member {member_id}")
        return member_id, True
    except Exception as e:
        logger.error(f"Crawl failed for member {member_id}: {e}")
        return member_id, False


def main():
    logger.info("=== Crawler Starting ===")

    setup_db()

    logger.info("Fetching users from database...")
    with session_context() as db:
        members = db.query(Member).filter(Member.riot_id.isnot(None)).all()
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

    success_count = 0
    fail_count = 0

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = {
            executor.submit(crawl_member, member_id, game_name, tag_line): member_id
            for member_id, game_name, tag_line in crawl_tasks
        }

        for future in as_completed(futures):
            member_id = futures[future]
            try:
                _, success = future.result()
                if success:
                    success_count += 1
                else:
                    fail_count += 1
            except Exception as e:
                logger.error(f"Unexpected error for member {member_id}: {e}")
                fail_count += 1

            logger.info(
                f"Progress: {success_count + fail_count}/{len(crawl_tasks)} completed"
            )

    logger.info("=== Crawler Finished ===")
    logger.info(
        f"Success: {success_count}, Failed: {fail_count}, Total: {len(crawl_tasks)}"
    )


if __name__ == "__main__":
    main()
