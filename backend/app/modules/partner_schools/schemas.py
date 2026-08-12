from datetime import datetime

from pydantic import BaseModel, ConfigDict


class PartnerSchoolCreate(BaseModel):
    name: str


class PartnerSchoolUpdate(BaseModel):
    name: str | None = None
    is_active: bool | None = None


class PartnerSchoolResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    school_id: int
    name: str
    is_active: bool
    created_at: datetime | None = None
    updated_at: datetime | None = None


class PartnerSchoolStudentResponse(BaseModel):
    student_id: int
    partner_school_id: int


class AssociateStudentsRequest(BaseModel):
    student_ids: list[int]


class StudentPartnerSchoolResponse(BaseModel):
    id: int
    name: str
