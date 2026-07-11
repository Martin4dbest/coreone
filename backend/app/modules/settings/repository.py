from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.setting import Setting


class SettingRepository:

    def __init__(self, db: AsyncSession):
        self.db = db


    async def get_all(self):
        result = await self.db.execute(
            select(Setting).order_by(
                Setting.key
            )
        )

        return result.scalars().all()


    async def get_by_id(
        self,
        setting_id: int,
    ):
        result = await self.db.execute(
            select(Setting).where(
                Setting.id == setting_id
            )
        )

        return result.scalar_one_or_none()


    async def create(
        self,
        setting: Setting,
    ):
        self.db.add(setting)
        await self.db.commit()
        await self.db.refresh(setting)

        return setting
