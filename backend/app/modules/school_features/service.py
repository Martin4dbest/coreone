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
    "school_books",
    "school_bus",
    "licensing",
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

        # Existing schools may have been created before a new
        # feature was added to DEFAULT_FEATURES. In that case,
        # create the missing feature row automatically instead
        # of returning 404.
        #
        # Unknown feature keys are still rejected so callers
        # cannot create arbitrary feature records.
        if not feature:
            if feature_key not in DEFAULT_FEATURES:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=(
                        f"Feature '{feature_key}' "
                        "is not a valid CoreOne feature."
                    ),
                )

            feature = await self.repository.create(
                SchoolFeature(
                    school_id=school_id,
                    feature_key=feature_key,
                    enabled=enabled,
                )
            )

            await self.repository.commit()

            return feature

        feature.enabled = enabled

        await self.repository.commit()

        return feature
