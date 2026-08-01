from sqlalchemy import select

from app.models.google_token import GoogleToken


class GoogleTokenRepository:

    def __init__(self, db):
        self.db = db

    async def get(
        self,
        school_id: int,
    ):
        result = await self.db.execute(
            select(GoogleToken).where(
                GoogleToken.school_id == school_id
            )
        )
        return result.scalar_one_or_none()

    async def create(
        self,
        token,
    ):
        self.db.add(token)
        await self.db.commit()
        await self.db.refresh(token)
        return token

    async def update(
        self,
        token,
    ):
        await self.db.commit()
        await self.db.refresh(token)
        return token
