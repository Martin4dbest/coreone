from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.setting import Setting
from app.modules.settings.repository import SettingRepository
from app.modules.settings.schemas import SettingCreateRequest


class SettingService:

    def __init__(self, db: AsyncSession):
        self.repository = SettingRepository(db)


    async def create_setting(
        self,
        payload: SettingCreateRequest,
    ):

        setting = Setting(
            school_id=payload.school_id,
            key=payload.key,
            value=payload.value,
            description=payload.description,
            is_active=True,
        )

        return await self.repository.create(
            setting
        )


    async def get_settings(self):
        return await self.repository.get_all()


    async def get_setting(
        self,
        setting_id: int,
    ):

        setting = await self.repository.get_by_id(
            setting_id
        )

        if not setting:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Setting not found",
            )

        return setting
