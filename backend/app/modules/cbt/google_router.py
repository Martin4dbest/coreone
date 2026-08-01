from fastapi import APIRouter

from app.modules.cbt.google_service import (
    GoogleOAuthService,
)

router = APIRouter(
    prefix="/cbt/google",
    tags=["Google CBT"],
)


@router.get("/authorize")
async def authorize():

    return {

        "authorization_url":

        GoogleOAuthService().authorization_url()

    }


@router.post("/callback")
async def callback(
    payload: dict,
):

    return await GoogleOAuthService().exchange_code(
        payload["code"]
    )
