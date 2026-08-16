from fastapi import HTTPException, status

from app.models.school_feature import SchoolFeature
from app.modules.school_features.repository import (
    SchoolFeatureRepository,
)


DEFAULT_FEATURES = [
    "students",
    "teachers",
    "staff",
    "classes",
    "academics",
    "attendance",
    "learning",
    "ebooks",
    "browser",
    "youtube_learning",
    "cbt",
    "results",
    "events",
    "notifications",
    "settings",
    "branding",
    "partner_schools",
]


class SchoolFeatureService:

    def __init__(self, db):
        self.db = db
        self.repository = SchoolFeatureRepository(db)

    async def create_defaults(
        self,
        school_id: int,
    ):
        for feature in DEFAULT_FEATURES:
            existing = await self.repository.get(
                school_id,
                feature,
            )

            if existing:
                continue

            await self.repository.create(
                SchoolFeature(
                    school_id=school_id,
                    feature_key=feature,
                    enabled=True,
                )
            )

        await self.repository.commit()

    async def list_features(
        self,
        school_id: int,
    ):
        return await self.repository.get_all(
            school_id
        )

    async def toggle(
        self,
        school_id: int,
        feature_key: str,
        enabled: bool,
    ):
        feature = await self.repository.get(
            school_id,
            feature_key,
        )

        if not feature:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=(
                    f"Feature '{feature_key}' "
                    "is not configured for this school."
                ),
            )

        feature.enabled = enabled

        await self.repository.commit()

        return feature
