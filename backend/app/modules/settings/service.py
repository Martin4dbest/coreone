from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.setting import Setting
from app.modules.settings.repository import SettingRepository
from app.modules.settings.schemas import (
    SettingCreateRequest,
    SettingUpdateRequest,
)


class SettingService:

    def __init__(self, db: AsyncSession):
        self.repository = SettingRepository(db)

    async def create_setting(
        self,
        payload: SettingCreateRequest,
        current_user,
    ):
        if current_user.role.name != "SUPER_ADMIN":
            if payload.school_id != current_user.school_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You cannot create settings for another school",
                )

        setting = Setting(
            school_id=payload.school_id,
            key=payload.key,
            value=payload.value,
            description=payload.description,
            is_active=True,
        )

        return await self.repository.create(setting)

    async def get_settings(
        self,
        current_user,
        school_id: int | None = None,
    ):
        if current_user.role.name != "SUPER_ADMIN":
            school_id = current_user.school_id

        return await self.repository.get_all(school_id)

    async def get_setting(
        self,
        setting_id: int,
        current_user,
    ):
        school_id = None

        if current_user.role.name != "SUPER_ADMIN":
            school_id = current_user.school_id

        setting = await self.repository.get_by_id(
            setting_id,
            school_id,
        )

        if not setting:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Setting not found",
            )

        return setting

    async def update_setting(
        self,
        setting_id: int,
        payload: SettingUpdateRequest,
        current_user,
    ):
        school_id = None

        if current_user.role.name != "SUPER_ADMIN":
            school_id = current_user.school_id

        setting = await self.repository.get_by_id(
            setting_id,
            school_id,
        )

        if not setting:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Setting not found",
            )

        setting.key = payload.key
        setting.value = payload.value
        setting.description = payload.description

        return await self.repository.update(setting)

    async def toggle_setting_status(
        self,
        setting_id: int,
        current_user,
    ):
        school_id = None

        if current_user.role.name != "SUPER_ADMIN":
            school_id = current_user.school_id

        setting = await self.repository.get_by_id(
            setting_id,
            school_id,
        )

        if not setting:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Setting not found",
            )

        setting.is_active = not setting.is_active

        return await self.repository.update(setting)

    async def delete_setting(
        self,
        setting_id: int,
        current_user,
    ):
        school_id = None

        if current_user.role.name != "SUPER_ADMIN":
            school_id = current_user.school_id

        setting = await self.repository.get_by_id(
            setting_id,
            school_id,
        )

        if not setting:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Setting not found",
            )

        await self.repository.delete(setting)

        return {
            "message": "Setting deleted successfully"
        }