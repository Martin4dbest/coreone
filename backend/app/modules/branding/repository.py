from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.school_branding import SchoolBranding


class BrandingRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(
        self,
        branding: SchoolBranding,
    ):
        self.db.add(branding)
        await self.db.commit()
        await self.db.refresh(branding)

        return branding

    async def update(
        self,
        branding: SchoolBranding,
    ):
        await self.db.commit()
        await self.db.refresh(branding)

        return branding

    async def get_by_school_id(
        self,
        school_id: int,
    ):
        result = await self.db.execute(
            select(SchoolBranding).where(
                SchoolBranding.school_id == school_id
            )
        )

        return result.scalar_one_or_none()

    async def get_by_id(
        self,
        branding_id: int,
    ):
        result = await self.db.execute(
            select(SchoolBranding).where(
                SchoolBranding.id == branding_id
            )
        )

        return result.scalar_one_or_none()
