from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.visitor import Visitor
from app.modules.visitors.repository import VisitorRepository
from app.modules.visitors.schemas import VisitorCreateRequest


class VisitorService:

    def __init__(self, db: AsyncSession):
        self.repository = VisitorRepository(db)

    async def create_visitor(
        self,
        payload: VisitorCreateRequest,
    ):
        visitor = Visitor(
            school_id=payload.school_id,
            full_name=payload.full_name,
            phone=payload.phone,
            purpose=payload.purpose,
            person_to_visit=payload.person_to_visit,
        )

        return await self.repository.create(visitor)

    async def get_visitors(self):
        return await self.repository.get_all()

    async def get_visitor(self, visitor_id: int):
        visitor = await self.repository.get_by_id(visitor_id)

        if not visitor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Visitor not found",
            )

        return visitor

    async def check_out_visitor(
        self,
        visitor_id: int,
    ):
        visitor = await self.get_visitor(visitor_id)

        if visitor.check_out_time is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Visitor has already checked out",
            )

        return await self.repository.check_out(visitor)
