from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.timetable_entry import TimetableEntry


class TimetableRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(
        self,
        entry_id: int,
        school_id: int | None = None,
    ):
        stmt = select(TimetableEntry).where(
            TimetableEntry.id == entry_id,
            TimetableEntry.is_active.is_(True),
        )

        if school_id is not None:
            stmt = stmt.where(
                TimetableEntry.school_id == school_id
            )

        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def create(self, entry: TimetableEntry):
        self.db.add(entry)
        await self.db.commit()
        await self.db.refresh(entry)
        return entry

    async def update(self, entry: TimetableEntry):
        await self.db.commit()
        await self.db.refresh(entry)
        return entry

    async def deactivate(self, entry: TimetableEntry):
        entry.is_active = False
        await self.db.commit()
        await self.db.refresh(entry)
        return entry
