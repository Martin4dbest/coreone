import asyncio
from pathlib import Path
from sqlalchemy import select

from app.db.database import AsyncSessionLocal
from app.models.ebook import Ebook


async def main():
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Ebook).order_by(Ebook.id)
        )

        ebooks = result.scalars().all()

        print("=" * 80)
        print("EBOOK DATABASE + FILE CHECK")
        print("=" * 80)

        for ebook in ebooks:
            filename = (
                Path(ebook.file_url.split("?")[0]).name
                if ebook.file_url
                else None
            )

            protected_file = None
            if filename:
                protected_file = (
                    Path.cwd()
                    / "protected_ebooks"
                    / str(ebook.school_id)
                    / "files"
                    / filename
                )

            print()
            print(f"ID:             {ebook.id}")
            print(f"School ID:      {ebook.school_id}")
            print(f"Title:          {ebook.title}")
            print(f"File URL:       {ebook.file_url}")
            print(f"File name:      {ebook.file_name}")
            print(f"Filename:       {filename}")
            print(f"Protected path: {protected_file}")
            print(
                f"File exists:    "
                f"{protected_file.is_file() if protected_file else False}"
            )

        print()
        print("=" * 80)


if __name__ == "__main__":
    asyncio.run(main())
