import asyncio
import signal
from pathlib import Path

from shared.utils.logging import setup_logging
from shared.utils.redis import close_redis, setup_redis

from .manager import AuctionWorkerManager


setup_logging(log_dir=Path(__file__).resolve().parent / "logs")


async def main() -> None:
    await setup_redis()

    manager = AuctionWorkerManager()
    await manager.setup()

    stop_event = asyncio.Event()

    loop = asyncio.get_running_loop()
    for sig in (signal.SIGTERM, signal.SIGINT):
        try:
            loop.add_signal_handler(sig, stop_event.set)
        except NotImplementedError:
            # Windows does not support add_signal_handler for SIGTERM
            signal.signal(sig, lambda *_: stop_event.set())

    await stop_event.wait()

    await manager.cleanup()
    await close_redis()


if __name__ == "__main__":
    asyncio.run(main())
