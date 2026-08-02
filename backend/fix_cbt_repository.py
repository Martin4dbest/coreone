from pathlib import Path

p = Path("app/modules/cbt/repository.py")

text = p.read_text()

text = text.replace(
    "from sqlalchemy import select\n",
    "from sqlalchemy import select\nfrom sqlalchemy.orm import selectinload\n"
)

text = text.replace(
'''select(CBTExam).where(
                CBTExam.id == exam_id
            )''',
'''select(CBTExam)
            .options(
                selectinload(CBTExam.subject),
                selectinload(CBTExam.classroom),
                selectinload(CBTExam.questions),
            )
            .where(
                CBTExam.id == exam_id
            )'''
)

text = text.replace(
'''select(CBTExam)
            .where(
                CBTExam.school_id == school_id
            )''',
'''select(CBTExam)
            .options(
                selectinload(CBTExam.subject),
                selectinload(CBTExam.classroom),
                selectinload(CBTExam.questions),
            )
            .where(
                CBTExam.school_id == school_id
            )'''
)

p.write_text(text)

print("CBT repository fixed")
