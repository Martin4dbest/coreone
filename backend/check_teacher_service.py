from app.modules.teachers.service import TeacherService
from app.modules.teachers.repository import TeacherRepository

print("TeacherService:", TeacherService)
print("TeacherRepository:", TeacherRepository)
print()

print("TeacherRepository methods:")
print(hasattr(
    TeacherRepository,
    "get_teacher_assignments_summary",
))

print()

service_init = TeacherService.__init__.__code__.co_varnames
print("TeacherService.__init__ args:")
print(service_init)
