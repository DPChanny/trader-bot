from sqlalchemy.ext.asyncio import AsyncSession


CHUNK_SIZE = 1000


class BaseRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
