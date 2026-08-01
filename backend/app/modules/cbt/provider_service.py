from fastapi import HTTPException
from fastapi import status

from app.modules.cbt.provider_repository import (
    CBTProviderRepository,
)


class CBTProviderService:

    def __init__(self, db):
        self.repository = CBTProviderRepository(db)

    async def list_providers(
        self,
        school_id: int,
    ):
        return await self.repository.get_all(
            school_id
        )

    async def get_provider(
        self,
        school_id: int,
        provider: str,
    ):
        item = await self.repository.get_provider(
            school_id,
            provider,
        )

        if item is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Provider not found",
            )

        return item

    async def update_provider(
        self,
        school_id: int,
        provider: str,
        payload,
    ):

        item = await self.get_provider(
            school_id,
            provider,
        )

        item.enabled = payload.enabled
        item.api_url = payload.api_url
        item.api_key = payload.api_key
        item.oauth_client_id = payload.oauth_client_id
        item.oauth_client_secret = payload.oauth_client_secret
        item.refresh_token = payload.refresh_token
        item.drive_folder_id = payload.drive_folder_id

        item.sync_results = payload.sync_results
        item.auto_import = payload.auto_import
        item.auto_export = payload.auto_export

        return await self.repository.update(
            item
        )

    async def enable_provider(
        self,
        school_id: int,
        provider: str,
    ):

        item = await self.get_provider(
            school_id,
            provider,
        )

        item.enabled = True

        return await self.repository.update(
            item
        )

    async def disable_provider(
        self,
        school_id: int,
        provider: str,
    ):

        item = await self.get_provider(
            school_id,
            provider,
        )

        item.enabled = False

        return await self.repository.update(
            item
        )
