from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db

from app.modules.school_features.schemas import (
    FeatureToggleRequest,
    SchoolFeatureResponse,
)

from app.modules.school_features.service import (
    SchoolFeatureService,
)

router = APIRouter(
    prefix="/school-features",
    tags=["School Features"],
)


@router.get(
    "/{school_id}",
    response_model=list[SchoolFeatureResponse],
)
async def list_school_features(
    school_id: int,
    db: AsyncSession = Depends(get_db),
):

    return await SchoolFeatureService(
        db
    ).list_features(
        school_id
    )


@router.patch(
    "/{school_id}/{feature_key}",
    response_model=SchoolFeatureResponse,
)
async def toggle_school_feature(
    school_id: int,
    feature_key: str,
    payload: FeatureToggleRequest,
    db: AsyncSession = Depends(get_db),
):

    return await SchoolFeatureService(
        db
    ).toggle(
        school_id=school_id,
        feature_key=feature_key,
        enabled=payload.enabled,
    )