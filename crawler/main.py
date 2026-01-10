import asyncio
import logging
import signal
import sys

from services.crawler_service import crawler_service
from utils.database import init_engine

logging.basicConfig(
    level=logging.INFO,
    format="%(levelname)s - %(name)s - %(message)s",
)

logger = logging.getLogger(__name__)


def signal_handler(signum, frame):
    logger.info(f"Signal {signum}, shutting down...")

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    try:
        logger.info("Stopping Crawler service...")
        loop.run_until_complete(crawler_service.stop())
        logger.info("Crawler service stopped")
    except Exception as e:
        logger.error(f"Error during shutdown: {e}")
        import traceback

        logger.error(traceback.format_exc())
    finally:
        try:
            loop.close()
        except Exception as e:
            logger.error(f"Error closing event loop: {e}")

    logger.info("Exiting...")
    sys.exit(0)


signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)
if sys.platform == "win32":
    signal.signal(signal.SIGBREAK, signal_handler)


async def main():
    init_engine()
    await crawler_service.start()

    logger.info("Crawler service is running...")

    try:
        while True:
            await asyncio.sleep(1)
    except asyncio.CancelledError:
        logger.info("Main loop cancelled")
    finally:
        await crawler_service.stop()


if __name__ == "__main__":
    asyncio.run(main())
