from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.staff import Staff
from app.models.staff_leave import StaffLeave
from app.modules.staff.leave_repository import StaffLeaveRepository
from app.modules.staff.leave_schemas import (
    StaffLeaveCreateRequest,
    StaffLeaveReviewRequest,
)


class StaffLeaveService:

    def __init__(self, db: AsyncSession):
        self.db = db
        self.repository = StaffLeaveRepository(db)

    def _school_id(self, current_user):
        return current_user.school_id

    async def _get_staff_for_user(self, current_user):
        result = await self.db.execute(
            select(Staff).where(
                Staff.user_id == current_user.id
            )
        )

        staff = result.scalar_one_or_none()

        if not staff:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Staff profile not found",
            )

        return staff

    async def create_leave(
        self,
        payload: StaffLeaveCreateRequest,
        current_user,
    ):
        if current_user.role.name != "STAFF":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Staff access required",
            )

        if payload.end_date < payload.start_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="End date cannot be before start date",
            )

        staff = await self._get_staff_for_user(current_user)

        leave = StaffLeave(
            staff_id=staff.id,
            school_id=current_user.school_id,
            leave_type=payload.leave_type,
            start_date=payload.start_date,
            end_date=payload.end_date,
            reason=payload.reason,
            status="PENDING",
        )

        return await self.repository.create(leave)

    async def get_my_leave(self, current_user):
        staff = await self._get_staff_for_user(current_user)

        return await self.repository.get_all(
            school_id=current_user.school_id,
            staff_id=staff.id,
        )

    async def get_all(self, current_user):
        return await self.repository.get_all(
            school_id=self._school_id(current_user)
        )

    async def review(
        self,
        leave_id: int,
        payload: StaffLeaveReviewRequest,
        current_user,
    ):
        leave = await self.repository.get_by_id(
            leave_id,
            self._school_id(current_user),
        )

        if not leave:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Leave request not found",
            )

        new_status = payload.status.upper()

        if new_status not in {
            "PENDING",
            "APPROVED",
            "REJECTED",
        }:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid leave status",
            )

        leave.status = new_status
        leave.admin_remarks = payload.admin_remarks

        await self.db.commit()
        await self.db.refresh(leave)

        return leave
