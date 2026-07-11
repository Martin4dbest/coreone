from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.parent import Parent
from app.models.role import Role
from app.models.user import User

from app.modules.auth.security import hash_password
from app.modules.parents.repository import ParentRepository
from app.modules.parents.schemas import ParentCreateRequest


class ParentService:

    def __init__(self, db: AsyncSession):
        self.db = db
        self.repository = ParentRepository(db)

    async def get_parents(self):
        return await self.repository.get_all()

    async def get_parent(self, parent_id: int):
        parent = await self.repository.get_by_id(parent_id)

        if parent is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parent not found",
            )

        return parent

    async def create_parent(
        self,
        payload: ParentCreateRequest,
    ):
        result = await self.db.execute(
            select(User).where(
                User.email == payload.email
            )
        )

        existing_user = result.scalar_one_or_none()

        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already exists",
            )

        result = await self.db.execute(
            select(Role).where(
                Role.name == "PARENT"
            )
        )

        role = result.scalar_one()

        user = User(
            email=payload.email,
            hashed_password=hash_password(payload.password),
            school_id=payload.school_id,
            role_id=role.id,
            is_active=True,
            is_verified=False,
        )

        self.db.add(user)
        await self.db.flush()

        parent = Parent(
            user_id=user.id,
            first_name=payload.first_name,
            last_name=payload.last_name,
            phone=payload.phone,
        )

        self.db.add(parent)

        await self.db.commit()
        await self.db.refresh(parent)

        return parent
