from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.parent import Parent
from app.models.parent_student import ParentStudent
from app.models.payment import Payment
from app.models.school_payment_setting import SchoolPaymentSetting
from app.models.student import Student
from app.models.student_fee import StudentFee


class PaymentRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_settings(
        self,
        school_id: int,
    ) -> SchoolPaymentSetting | None:
        result = await self.db.execute(
            select(SchoolPaymentSetting).where(
                SchoolPaymentSetting.school_id == school_id
            )
        )

        return result.scalar_one_or_none()

    async def create_settings(
        self,
        settings: SchoolPaymentSetting,
    ) -> SchoolPaymentSetting:
        self.db.add(settings)
        await self.db.commit()
        await self.db.refresh(settings)

        return settings

    async def save_settings(
        self,
        settings: SchoolPaymentSetting,
    ) -> SchoolPaymentSetting:
        await self.db.commit()
        await self.db.refresh(settings)

        return settings

    async def get_parent_by_user_id(
        self,
        user_id: int,
    ) -> Parent | None:
        result = await self.db.execute(
            select(Parent).where(
                Parent.user_id == user_id
            )
        )

        return result.scalar_one_or_none()

    async def get_parent_student_fee(
        self,
        parent_id: int,
        student_fee_id: int,
    ) -> StudentFee | None:
        result = await self.db.execute(
            select(StudentFee)
            .join(
                Student,
                Student.id == StudentFee.student_id,
            )
            .join(
                ParentStudent,
                ParentStudent.student_id == Student.id,
            )
            .where(
                StudentFee.id == student_fee_id,
                ParentStudent.parent_id == parent_id,
                Student.school_id == StudentFee.school_id,
            )
        )

        return result.scalar_one_or_none()

    async def create_payment(
        self,
        payment: Payment,
    ) -> Payment:
        self.db.add(payment)

        await self.db.flush()
        await self.db.commit()
        await self.db.refresh(payment)

        return payment

    async def save_payment(
        self,
        payment: Payment,
    ) -> Payment:
        await self.db.commit()
        await self.db.refresh(payment)

        return payment
