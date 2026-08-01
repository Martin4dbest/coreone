from fastapi import APIRouter
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db

from app.modules.cbt.provider_service import (
    CBTProviderService,
)

from app.modules.cbt.provider_schemas import (
    ProviderResponse,
    ProviderUpdateRequest,
)

router = APIRouter(
    prefix="/cbt/providers",
    tags=["CBT Providers"],
)

@router.get(
    "/{school_id}",
    response_model=list[ProviderResponse],
)
async def list_providers(
    school_id:int,
    db:AsyncSession=Depends(get_db),
):
    return await CBTProviderService(
        db
    ).list_providers(
        school_id
    )

@router.put(
    "/{school_id}/{provider}",
    response_model=ProviderResponse,
)
async def update_provider(
    school_id:int,
    provider:str,
    payload:ProviderUpdateRequest,
    db:AsyncSession=Depends(get_db),
):
    return await CBTProviderService(
        db
    ).update_provider(
        school_id,
        provider,
        payload,
    )

@router.patch(
    "/{school_id}/{provider}/enable",
)
async def enable_provider(
    school_id:int,
    provider:str,
    db:AsyncSession=Depends(get_db),
):
    return await CBTProviderService(
        db
    ).enable_provider(
        school_id,
        provider,
    )

@router.patch(
    "/{school_id}/{provider}/disable",
)
async def disable_provider(
    school_id:int,
    provider:str,
    db:AsyncSession=Depends(get_db),
):
    return await CBTProviderService(
        db
    ).disable_provider(
        school_id,
        provider,
    )
