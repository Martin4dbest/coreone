from pydantic import BaseModel


class DashboardResponse(BaseModel):

    total_schools: int
    total_students: int
    total_teachers: int
    total_parents: int
    total_staff: int
    total_classes: int
    total_visitors: int

    assigned_subjects: int | None = 0
