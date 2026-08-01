from app.models.school_feature import SchoolFeature
from app.modules.school_features.repository import (
    SchoolFeatureRepository,
)


DEFAULT_FEATURES = [

    "attendance",

    "ebooks",

    "browser",

    "youtube_learning",

    "cbt",

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

        if feature:

            feature.enabled = enabled

            await self.repository.commit()

        return feature
