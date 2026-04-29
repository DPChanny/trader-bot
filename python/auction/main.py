import asyncio
import signal
from pathlib import Path

from shared.utils.env import get_log_dir
from shared.utils.logging import setup_logging
from shared.utils.redis import cleanup_redis, setup_redis

from .auction_manager import AuctionManager


setup_logging(log_dir=get_log_dir() or Path(__file__).resolve().parent / "logs")


async def main() -> None:
    await setup_redis()

    await AuctionManager.setup()

    stop_event = asyncio.Event()

    loop = asyncio.get_running_loop()
    for sig in (signal.SIGTERM, signal.SIGINT):
        try:
            loop.add_signal_handler(sig, stop_event.set)
        except NotImplementedError:
            # Windows does not support add_signal_handler for SIGTERM
            signal.signal(sig, lambda *_: stop_event.set())

    await stop_event.wait()

    await AuctionManager.cleanup()
    await cleanup_redis()


if __name__ == "__main__":
    asyncio.run(main())
