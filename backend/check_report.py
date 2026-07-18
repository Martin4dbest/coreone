from app.modules.results.service import ResultService
from app.db.database import AsyncSessionLocal
from sqlalchemy import select
from app.models.student import Student
import asyncio

async def main():

    async with AsyncSessionLocal() as db:

        service = ResultService(db)

        report = await service.get_student_report(
            9,
            None
        )

        print(report["student"])
        print("\nSUBJECTS:")
        for x in report["subjects"]:
            print(x)

asyncio.run(main())
