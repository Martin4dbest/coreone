from pathlib import Path

p = Path("app/models/cbt_exam.py")

text = p.read_text()

old = '''    school = relationship("School")
'''

new = '''    school = relationship("School")

    subject = relationship("Subject")

    classroom = relationship("Classroom")

    questions = relationship(
        "CBTQuestion",
        back_populates="exam",
        cascade="all, delete-orphan",
    )
'''

if old in text and "classroom = relationship" not in text:
    text = text.replace(old, new)

p.write_text(text)

print("CBT model fixed")
