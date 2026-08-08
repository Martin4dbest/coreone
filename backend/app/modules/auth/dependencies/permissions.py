from fastapi import Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.user import User
from app.models.role import Role
from app.models.permission import Permission
from app.models.role_permission import RolePermission
from app.modules.auth.dependencies.current_user import get_current_user


def require_role(required_role: str):

    async def role_checker(
        current_user: User = Depends(get_current_user),
    ):

        if current_user.role.name != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient role permission",
            )

        return current_user

    return role_checker



def require_permission(permission_name: str):

    async def permission_checker(
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user),
    ):

        result = await db.execute(
            select(Permission)
            .join(
                RolePermission,
                RolePermission.permission_id == Permission.id
            )
            .where(
                RolePermission.role_id == current_user.role_id,
                Permission.name == permission_name,
                Permission.is_active == True,
            )
        )

        permission = result.scalar_one_or_none()

        if not permission:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Missing permission",
            )

        return current_user

    return permission_checker