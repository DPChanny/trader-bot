from sqlalchemy.ext.asyncio import AsyncSession

CHUNK_SIZE = 500


class BaseRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
