import logging
from concurrent.futures import ThreadPoolExecutor, as_completed

from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

from entities.user import User
from entities.lol_stat import LolStat, Champion
from entities.val_stat import ValStat, Agent
from services.lol_stat_service import crawl_lol_stat
from services.val_stat_service import crawl_val_stat
from utils.database import init_engine, get_db
from utils.crawler import get_chrome_options

logging.basicConfig(
    level=logging.INFO,
    format="%(levelname)s - %(name)s - %(message)s",
)

logger = logging.getLogger(__name__)

MAX_WORKERS = 5
PAGE_LOAD_TIMEOUT = 5
SCRIPT_TIMEOUT = 5


def create_driver(chrome_service: Service) -> webdriver.Chrome:
    chrome_options = get_chrome_options()
    chrome_options.page_load_strategy = "eager"
    driver = webdriver.Chrome(service=chrome_service, options=chrome_options)
    driver.execute_script(
        "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
    )
    driver.set_page_load_timeout(PAGE_LOAD_TIMEOUT)
    driver.set_script_timeout(SCRIPT_TIMEOUT)
    driver.implicitly_wait(0)
    return driver


def close_driver(driver: webdriver.Chrome):
    if driver:
        try:
            driver.quit()
        except Exception as e:
            logger.error(f"Driver quit error: {e}")


def save_lol_stat_to_db(user_id: int, lol_stat_dto):
    try:
        db = next(get_db())
        lol_stat = db.query(LolStat).filter(LolStat.user_id == user_id).first()

        if lol_stat:
            lol_stat.tier = lol_stat_dto.tier
            lol_stat.rank = lol_stat_dto.rank
            lol_stat.lp = lol_stat_dto.lp
            db.query(Champion).filter(
                Champion.lol_stat_id == lol_stat.id
            ).delete()
        else:
            lol_stat = LolStat(
                user_id=user_id,
                tier=lol_stat_dto.tier,
                rank=lol_stat_dto.rank,
                lp=lol_stat_dto.lp,
            )
            db.add(lol_stat)
            db.flush()

        for idx, champ in enumerate(lol_stat_dto.top_champions, start=1):
            champion = Champion(
                lol_stat_id=lol_stat.id,
                name=champ.name,
                icon_url=champ.icon_url,
                games=champ.games,
                win_rate=champ.win_rate,
                rank_order=idx,
            )
            db.add(champion)

        db.commit()
        db.close()
        logger.info(f"LOL stat data saved: {user_id}")
    except Exception as e:
        logger.error(f"Failed to save LOL stat data: {user_id} - {e}")


def save_val_stat_to_db(user_id: int, val_stat_dto):
    try:
        db = next(get_db())
        val_stat = db.query(ValStat).filter(ValStat.user_id == user_id).first()

        if val_stat:
            val_stat.tier = val_stat_dto.tier
            val_stat.rank = val_stat_dto.rank
            db.query(Agent).filter(Agent.val_stat_id == val_stat.id).delete()
        else:
            val_stat = ValStat(
                user_id=user_id, tier=val_stat_dto.tier, rank=val_stat_dto.rank
            )
            db.add(val_stat)
            db.flush()

        for idx, agent in enumerate(val_stat_dto.top_agents, start=1):
            agent_obj = Agent(
                val_stat_id=val_stat.id,
                name=agent.name,
                icon_url=agent.icon_url,
                games=agent.games,
                win_rate=agent.win_rate,
                rank_order=idx,
            )
            db.add(agent_obj)

        db.commit()
        db.close()
        logger.info(f"VAL stat data saved: {user_id}")
    except Exception as e:
        logger.error(f"Failed to save VAL stat data: {user_id} - {e}")


def crawl_user(
    user_id: int, game_name: str, tag_line: str, chrome_service: Service
):
    driver = None
    try:
        logger.info(
            f"Starting crawl for user {user_id}: {game_name}#{tag_line}"
        )
        driver = create_driver(chrome_service)

        try:
            lol_stat_dto = crawl_lol_stat(driver, game_name, tag_line)
            save_lol_stat_to_db(user_id, lol_stat_dto)
        except Exception as e:
            logger.error(
                f"LOL stat crawl failed for {user_id}: {type(e).__name__}: {str(e)}"
            )

        try:
            val_stat_dto = crawl_val_stat(driver, game_name, tag_line)
            save_val_stat_to_db(user_id, val_stat_dto)
        except Exception as e:
            logger.error(
                f"VAL stat crawl failed for {user_id}: {type(e).__name__}: {str(e)}"
            )

        logger.info(f"Finished crawl for user {user_id}")
        return user_id, True
    except Exception as e:
        logger.error(f"Crawl failed for user {user_id}: {e}")
        return user_id, False
    finally:
        close_driver(driver)


def main():
    logger.info("=== Crawler Starting ===")

    init_engine()

    logger.info("Initializing ChromeDriver...")
    chrome_service = Service(ChromeDriverManager().install())
    logger.info("ChromeDriver initialized")

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
            executor.submit(
                crawl_user, user_id, game_name, tag_line, chrome_service
            ): user_id
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
