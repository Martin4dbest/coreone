from app.modules.teachers.repository import TeacherRepository

print("Repository loaded from:")
print(TeacherRepository.__module__)
print()

print("Has get_teacher_assignments_summary?")
print(hasattr(
    TeacherRepository,
    "get_teacher_assignments_summary",
))
print()

print("Available methods:")
for item in dir(TeacherRepository):
    if not item.startswith("_"):
        print("-", item)
