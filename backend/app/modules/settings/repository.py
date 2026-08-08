from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.setting import Setting


class SettingRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(
        self,
        school_id: int | None = None,
    ):
        query = select(Setting).order_by(Setting.key)

        if school_id is not None:
            query = query.where(
                Setting.school_id == school_id
            )

        result = await self.db.execute(query)

        return result.scalars().all()

    async def get_by_id(
        self,
        setting_id: int,
        school_id: int | None = None,
    ):
        query = select(Setting).where(
            Setting.id == setting_id
        )

        if school_id is not None:
            query = query.where(
                Setting.school_id == school_id
            )

        result = await self.db.execute(query)

        return result.scalar_one_or_none()

    async def create(
        self,
        setting: Setting,
    ):
        self.db.add(setting)
        await self.db.commit()
        await self.db.refresh(setting)

        return setting

    async def update(
        self,
        setting: Setting,
    ):
        await self.db.commit()
        await self.db.refresh(setting)

        return setting

    async def delete(
        self,
        setting: Setting,
    ):
        await self.db.delete(setting)
        await self.db.commit()