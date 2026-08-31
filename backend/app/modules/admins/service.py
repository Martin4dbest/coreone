from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.modules.admins.repository import SchoolAdminRepository
from app.modules.admins.schemas import SchoolAdminCreateRequest
from app.modules.roles.repository import RoleRepository
from app.modules.schools.repository import SchoolRepository
from app.modules.users.service import UserService


class SchoolAdminService:

    def __init__(self, db: AsyncSession):
        self.repository = SchoolAdminRepository(db)
        self.role_repository = RoleRepository(db)
        self.school_repository = SchoolRepository(db)
        self.user_service = UserService(db)

    def _require_super_admin(
        self,
        current_user: User,
    ) -> None:
        if current_user.role.name != "SUPER_ADMIN":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only Super Admin can manage School Admin accounts",
            )

    async def create_school_admin(
        self,
        payload: SchoolAdminCreateRequest,
        current_user: User,
    ):
        self._require_super_admin(current_user)

        school = await self.school_repository.get_by_id(
            payload.school_id
        )

        if school is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="School not found",
            )

        role = await self.role_repository.get_by_name(
            "SCHOOL_ADMIN"
        )

        if role is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="SCHOOL_ADMIN role not configured",
            )

        return await self.user_service.create_internal_user(
            email=payload.email,
            password=payload.password,
            school_id=payload.school_id,
            role_id=role.id,
        )

    async def get_school_admins(
        self,
        current_user: User,
        school_id: int | None = None,
    ):
        role_name = current_user.role.name

        if role_name == "SCHOOL_ADMIN":
            school_id = current_user.school_id

            if not school_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="School Admin is not assigned to a school.",
                )

        elif role_name == "SUPER_ADMIN":
            if school_id is not None:
                school = await self.school_repository.get_by_id(
                    school_id
                )

                if school is None:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="School not found",
                    )
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not authorized to view school admins.",
            )

        return await self.repository.get_all(
            school_id
        )

    async def get_school_admin(
        self,
        admin_id: int,
        current_user: User,
    ):
        self._require_super_admin(current_user)

        admin = await self.repository.get_by_id(
            admin_id
        )

        if admin is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="School Admin not found",
            )

        return admin



    async def delete_school_admin(
        self,
        admin_id: int,
        current_user: User,
    ):
        self._require_super_admin(current_user)

        admin = await self.repository.get_by_id(admin_id)

        if admin is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="School Admin not found",
            )

        # A School Administrator is represented by the User record.
        # Existing CASCADE relationships will remove dependent
        # profile records where the database explicitly allows it.
        try:
            await self.repository.delete(admin)

            return {
                "message": "School Admin deleted successfully.",
                "admin_id": admin_id,
            }

        except HTTPException:
            raise

        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "This School Admin cannot be deleted yet because "
                    "another school record still references this account. "
                    f"Database detail: {exc}"
                ),
            )

    async def update_status(
        self,
        admin_id: int,
        is_active: bool,
        current_user: User,
    ):
        self._require_super_admin(current_user)

        admin = await self.repository.get_by_id(
            admin_id
        )

        if admin is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="School Admin not found",
            )

        admin.is_active = is_active

        return await self.repository.update(admin)