from pydantic import BaseModel, EmailStr


class TeacherCreateRequest(BaseModel):
    email: EmailStr
    password: str
    school_id: int
    employee_number: str
    first_name: str
    last_name: str


class TeacherAssignmentMini(BaseModel):
    id: int
    subject_id: int
    classroom_id: int

    class Config:
        from_attributes = True


class TeacherResponse(BaseModel):
    id: int
    user_id: int
    employee_number: str
    first_name: str
    last_name: str
    assignments: list[TeacherAssignmentMini] = []

    class Config:
        from_attributes = True


class TeacherSubjectSummary(BaseModel):
    classroom: str
    subject: str


class TeacherAssignmentSummaryResponse(BaseModel):
    teacher: str
    email: str | None = None
    class_teacher_of: list[str]
    subjects: list[TeacherSubjectSummary]