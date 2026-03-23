import logging
import re

from selenium import webdriver
from selenium.common.exceptions import TimeoutException
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as ec
from selenium.webdriver.support.ui import WebDriverWait

from shared.database import get_db
from shared.dtos.lol_stat_dto import ChampionDto, LolStatDto
from shared.entities.lol_stat import Champion, LolStat


logger = logging.getLogger(__name__)

WEB_DRIVER_TIMEOUT = 20


def save_lol_stat_to_db(user_id: int, lol_stat_dto: LolStatDto):
    """
    LOL 스탯 데이터를 데이터베이스에 저장합니다.
    """
    try:
        db = next(get_db())
        lol_stat = db.query(LolStat).filter(LolStat.user_id == user_id).first()

        if lol_stat:
            lol_stat.tier = lol_stat_dto.tier
            lol_stat.rank = lol_stat_dto.rank
            lol_stat.lp = lol_stat_dto.lp
            db.query(Champion).filter(Champion.lol_stat_id == lol_stat.id).delete()
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


def crawl_lol_stat(
    driver: webdriver.Chrome, game_name: str, tag_line: str
) -> LolStatDto:
    encoded_name = game_name.replace(" ", "%20")
    url = f"https://op.gg/ko/lol/summoners/kr/{encoded_name}-{tag_line}?queue_type=SOLORANKED"

    tier = "Unranked"
    rank = ""
    lp = 0
    top_champions = []

    try:
        logger.info(f"Scraping: {url}")
        driver.get(url)
        logger.info(f"Page loaded: {url}")
    except TimeoutException:
        logger.warning(f"Page load timeout: {url}")
        return LolStatDto(
            tier=tier,
            rank=rank,
            lp=lp,
            top_champions=top_champions,
        )
    except Exception as e:
        logger.warning(f"Page load error: {url} - {type(e).__name__}")
        return LolStatDto(
            tier=tier,
            rank=rank,
            lp=lp,
            top_champions=top_champions,
        )

    try:
        wait = WebDriverWait(driver, WEB_DRIVER_TIMEOUT)
        tier_element = None
        tier_selectors = [
            "strong.text-xl.first-letter\\:uppercase",
            "strong[class*='text-xl']",
            "div[class*='TierRankInfo'] strong",
            "strong",
        ]

        for selector in tier_selectors:
            try:
                tier_element = wait.until(
                    ec.presence_of_element_located((By.CSS_SELECTOR, selector))
                )
                if tier_element and tier_element.text.strip():
                    break
            except Exception:
                continue

        if tier_element:
            tier_text = tier_element.text.strip()

            tier_pattern = r"(Unranked|Iron|Bronze|Silver|Gold|Platinum|Emerald|Diamond|Master|Grandmaster|Challenger)(?:\s+(I|II|III|IV|1|2|3|4))?"
            tier_match = re.search(tier_pattern, tier_text, re.IGNORECASE)

            if tier_match:
                tier = tier_match.group(1).capitalize()
                rank = tier_match.group(2) if tier_match.group(2) else ""
            else:
                tier = "Unranked"
                rank = ""

            try:
                lp_span = driver.find_element(
                    By.CSS_SELECTOR, "span.text-xs.text-gray-500"
                )
                lp_text = lp_span.text.strip()
                lp_match = re.search(r"(\d+)\s*LP", lp_text)
                lp = int(lp_match.group(1)) if lp_match else 0
            except Exception:
                lp = 0
        else:
            tier = "Unranked"
            rank = ""
            lp = 0
    except TimeoutException:
        logger.warning(f"Tier info timeout: {url}")
    except Exception as e:
        logger.warning(f"Tier info error: {url} - {type(e).__name__}")

    try:
        wait = WebDriverWait(driver, WEB_DRIVER_TIMEOUT)

        wait.until(
            ec.presence_of_element_located(
                (
                    By.CSS_SELECTOR,
                    "li.box-border.flex.w-full.items-center.border-b",
                )
            )
        )

        champ_elements = driver.find_elements(
            By.CSS_SELECTOR, "li.box-border.flex.w-full.items-center.border-b"
        )

        for champ_element in champ_elements[:3]:
            try:
                name = "Unknown"
                icon_url = ""
                games = 0
                win_rate = 0.0

                champ_img = champ_element.find_element(
                    By.CSS_SELECTOR, "img.rounded-full"
                )
                name = champ_img.get_attribute("alt") or "Unknown"
                icon_url = champ_img.get_attribute("src") or ""

                win_rate_container = champ_element.find_element(
                    By.CSS_SELECTOR,
                    "div.flex.basis-\\[92px\\].flex-col.text-right",
                )
                wr_span = win_rate_container.find_element(
                    By.CSS_SELECTOR, "span.text-xs"
                )
                wr_text = wr_span.text.strip().replace("%", "")
                win_rate = float(wr_text) if wr_text and wr_text != "" else 0.0

                games_span = win_rate_container.find_element(
                    By.CSS_SELECTOR, "span.text-2xs"
                )
                games_text = games_span.text.strip()
                games_match = re.search(r"(\d+)\s*게임", games_text)
                games = int(games_match.group(1)) if games_match else 0

                if name != "Unknown" and games > 0:
                    top_champions.append(
                        ChampionDto(
                            name=name,
                            icon_url=icon_url,
                            games=games,
                            win_rate=win_rate,
                        )
                    )
            except Exception as e:
                logger.debug(f"Champion parsing error: {type(e).__name__}")
                continue
    except TimeoutException:
        logger.warning(f"Champion list timeout: {url}")
    except Exception as e:
        logger.warning(f"Champion list error: {url} - {type(e).__name__}")

    return LolStatDto(
        tier=tier,
        rank=rank,
        lp=lp,
        top_champions=top_champions,
    )
