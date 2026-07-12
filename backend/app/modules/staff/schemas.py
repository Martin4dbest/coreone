from pydantic import BaseModel

class StaffCreateRequest(BaseModel):
    email: str
    password: str
    school_id: int

    employee_number: str
    first_name: str
    last_name: str


class StaffResponse(BaseModel):
    id: int
    user_id: int

    employee_number: str
    first_name: str
    last_name: str

    class Config:
        from_attributes = True
