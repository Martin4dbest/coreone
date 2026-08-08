from pydantic import BaseModel


class TeacherClassResponse(BaseModel):
    classroom_id: int
    classroom_name: str
    subject_id: int
    subject_name: str
    student_count: int

    class Config:
        from_attributes = True


class TeacherDashboardResponse(BaseModel):

    teacher_id: int
    teacher_name: str

    total_classes: int
    total_subjects: int

    classes: list[TeacherClassResponse]


class TeacherStudentResponse(BaseModel):
    id: int
    admission_number: str
    first_name: str
    middle_name: str | None = None
    last_name: str
    gender: str
    date_of_birth: str
    classroom_name: str

    class Config:
        from_attributes = True