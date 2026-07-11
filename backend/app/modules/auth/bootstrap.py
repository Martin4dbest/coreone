from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.permission import Permission
from app.models.role import Role
from app.models.role_permission import RolePermission
from app.models.school import School
from app.models.user import User
from app.modules.auth.security import hash_password


async def bootstrap_super_admin(db: AsyncSession):

    result = await db.execute(
        select(User).where(
            User.email == "admin@presense.com"
        )
    )

    existing_user = result.scalar_one_or_none()


    roles = [
        ("SUPER_ADMIN", "System Super Administrator"),
        ("SCHOOL_ADMIN", "School Administrator"),
        ("TEACHER", "Teaching Staff"),
        ("ACCOUNTANT", "Accounts Officer"),
        ("STUDENT", "Student"),
        ("PARENT", "Parent/Guardian"),
    ]


    for role_name, description in roles:

        result = await db.execute(
            select(Role).where(
                Role.name == role_name
            )
        )

        existing_role = result.scalar_one_or_none()

        if not existing_role:
            db.add(
                Role(
                    name=role_name,
                    description=description,
                )
            )


    await db.flush()


    result = await db.execute(
        select(Role).where(
            Role.name == "SUPER_ADMIN"
        )
    )

    role = result.scalar_one_or_none()


    result = await db.execute(
        select(School).where(
            School.school_code == "SYSTEM"
        )
    )

    school = result.scalar_one_or_none()


    if school is None:

        school = School(
            name="PreSense",
            school_code="SYSTEM",
            email="system@presense.com",
            phone="+234000000000",
            address="Head Office",
            city="Abuja",
            state="FCT",
        )

        db.add(school)
        await db.flush()


    if existing_user is None:

        admin = User(
            school_id=school.id,
            role_id=role.id,
            email="admin@presense.com",
            hashed_password=hash_password("Admin@123"),
            is_active=True,
            is_verified=True,
        )

        db.add(admin)


    permissions = [

        ("CREATE_USER", "Create users"),
        ("VIEW_USERS", "View users"),
        ("UPDATE_USER", "Update users"),

        ("CREATE_SCHOOL", "Create schools"),
        ("VIEW_SCHOOL", "View schools"),

        ("MANAGE_ROLES", "Manage roles"),
        ("MANAGE_PERMISSIONS", "Manage permissions"),

        ("MANAGE_STUDENTS", "Manage students"),
        ("MANAGE_TEACHERS", "Manage teachers"),
        ("MANAGE_PARENTS", "Manage parents"),

        ("MANAGE_CLASSES", "Manage classes"),
        ("MANAGE_RESULTS", "Manage results"),
        ("MANAGE_REPORTS", "Manage reports"),

    ]


    for name, description in permissions:

        result = await db.execute(
            select(Permission).where(
                Permission.name == name
            )
        )

        permission = result.scalar_one_or_none()


        if not permission:

            permission = Permission(
                name=name,
                description=description,
            )

            db.add(permission)
            await db.flush()


        result = await db.execute(
            select(RolePermission).where(
                RolePermission.role_id == role.id,
                RolePermission.permission_id == permission.id,
            )
        )

        existing_mapping = result.scalar_one_or_none()


        if not existing_mapping:

            db.add(
                RolePermission(
                    role_id=role.id,
                    permission_id=permission.id,
                )
            )


    await db.commit()
