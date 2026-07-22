from pydantic import BaseModel


class AssignClassTeacherRequest(BaseModel):
    classroom_id: int
    teacher_id: int


class ClassTeacherResponse(BaseModel):
    classroom_id: int
    teacher_id: int | None
    teacher_name: str | None

    class Config:
        from_attributes = True
