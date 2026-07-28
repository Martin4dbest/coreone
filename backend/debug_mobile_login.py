import asyncio

from app.db.database import AsyncSessionLocal
from app.modules.schools.repository import SchoolRepository
from app.modules.auth.repository import AuthRepository
from app.modules.auth.security import verify_password

async def main():
    async with AsyncSessionLocal() as db:
        school_repo = SchoolRepository(db)
        auth_repo = AuthRepository(db)

        school = await school_repo.get_by_code("LB1234")
        print("SCHOOL:", school)

        if school:
            user = await auth_repo.get_user_by_email(
                email="m@gmail.com",
                school_id=school.id,
            )

            print("USER:", user)

            if user:
                print("HASH:", user.hashed_password)
                print(
                    "PASSWORD VALID:",
                    verify_password(
                        "12345ab",
                        user.hashed_password,
                    ),
                )

asyncio.run(main())
