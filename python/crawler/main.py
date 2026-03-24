from concurrent.futures import ThreadPoolExecutor, as_completed

from loguru import logger
from python.backend.utils.log import setup_logging

from shared.database import get_db, init_engine
from shared.entities.user import User
from shared.env import get_log_format, get_log_level

from .services.lol_stat_service import crawl_lol_stat, save_lol_stat_to_db
from .services.val_stat_service import crawl_val_stat, save_val_stat_to_db
from .utils.crawler import close_driver, create_driver


setup_logging(log_level=get_log_level(), log_format=get_log_format())

MAX_WORKERS = 4


def crawl_user(user_id: int, game_name: str, tag_line: str):
    lol_driver = None
    val_driver = None
    try:
        logger.info(f"Starting crawl for user {user_id}: {game_name}#{tag_line}")

        try:
            lol_driver = create_driver()
            lol_stat_dto = crawl_lol_stat(lol_driver, game_name, tag_line)
            save_lol_stat_to_db(user_id, lol_stat_dto)
        except Exception as e:
            logger.error(
                f"LOL stat crawl failed for {user_id}: {type(e).__name__}: {str(e)}"
            )
        finally:
            close_driver(lol_driver)

        try:
            val_driver = create_driver()
            val_stat_dto = crawl_val_stat(val_driver, game_name, tag_line)
            save_val_stat_to_db(user_id, val_stat_dto)
        except Exception as e:
            logger.error(
                f"VAL stat crawl failed for {user_id}: {type(e).__name__}: {str(e)}"
            )
        finally:
            close_driver(val_driver)

        logger.info(f"Finished crawl for user {user_id}")
        return user_id, True
    except Exception as e:
        logger.error(f"Crawl failed for user {user_id}: {e}")
        return user_id, False


def main():
    logger.info("=== Crawler Starting ===")

    init_engine()

    logger.info("Fetching users from database...")
    db = next(get_db())
    users = db.query(User).filter(User.riot_id.isnot(None)).all()
    db.close()

    crawl_tasks = []
    for user in users:
        if user.riot_id and "#" in user.riot_id:
            game_name, tag_line = user.riot_id.split("#", 1)
            crawl_tasks.append((user.user_id, game_name, tag_line))

    logger.info(f"Found {len(crawl_tasks)} users to crawl")

    if not crawl_tasks:
        logger.info("No users to crawl. Exiting.")
        return

    success_count = 0
    fail_count = 0

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = {
            executor.submit(crawl_user, user_id, game_name, tag_line): user_id
            for user_id, game_name, tag_line in crawl_tasks
        }

        for future in as_completed(futures):
            user_id = futures[future]
            try:
                _, success = future.result()
                if success:
                    success_count += 1
                else:
                    fail_count += 1
            except Exception as e:
                logger.error(f"Unexpected error for user {user_id}: {e}")
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
