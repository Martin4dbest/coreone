from pydantic import BaseModel


class ClassCreateRequest(BaseModel):
    school_id: int
    level_id: int
    name: str


class ClassTeacherMiniResponse(BaseModel):
    id: int
    employee_number: str | None = None
    first_name: str
    last_name: str

    class Config:
        from_attributes = True


class ClassResponse(BaseModel):
    id: int
    school_id: int
    level_id: int
    name: str
    class_teacher: ClassTeacherMiniResponse | None = None

    class Config:
        from_attributes = True


class AssignClassTeacherRequest(BaseModel):
    teacher_id: int


class ClassTeacherResponse(BaseModel):
    id: int
    employee_number: str
    first_name: str
    last_name: str

    class Config:
        from_attributes = True


class SubjectTeacherResponse(BaseModel):
    subject_id: int
    teacher_id: int
    subject_name: str
    teacher_name: str


class ClassroomTeachersResponse(BaseModel):
    class_teacher: ClassTeacherResponse | None = None
    subject_teachers: list[SubjectTeacherResponse] = []
