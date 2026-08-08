from fastapi import HTTPException, status

from app.models.user import User


def check_school_access(
    current_user: User,
    school_id: int,
):
    """
    Ensures users can only access allowed schools.

    SUPER_ADMIN:
        Can access every school.

    SCHOOL_ADMIN and other users:
        Restricted to their assigned school.
    """

    if current_user.role.name == "SUPER_ADMIN":
        return True

    if current_user.school_id != school_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this school.",
        )

    return True