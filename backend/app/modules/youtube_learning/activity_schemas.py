from datetime import datetime

from pydantic import BaseModel


class YoutubeActivityResponse(BaseModel):
    id: int
    youtube_learning_id: int
    video_title: str
    student_id: int
    first_name: str | None = None
    last_name: str | None = None
    admission_number: str | None = None
    class_name: str | None = None
    email: str | None = None
    activity_type: str
    created_at: datetime
