import os
from urllib.parse import urlencode


class GoogleOAuthService:

    AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"

    SCOPES = [
        "https://www.googleapis.com/auth/forms.body",
        "https://www.googleapis.com/auth/forms.responses.readonly",
        "https://www.googleapis.com/auth/drive",
        "https://www.googleapis.com/auth/classroom.coursework.students",
        "openid",
        "email",
        "profile",
    ]

    def authorization_url(self):

        params = {

            "client_id": os.getenv(
                "GOOGLE_CLIENT_ID",
                "",
            ),

            "redirect_uri": os.getenv(
                "GOOGLE_REDIRECT_URI",
                "",
            ),

            "response_type": "code",

            "access_type": "offline",

            "prompt": "consent",

            "scope": " ".join(
                self.SCOPES
            ),

        }

        return f"{self.AUTH_URL}?{urlencode(params)}"

    async def exchange_code(
        self,
        code: str,
    ):
        """
        Exchange authorization code
        for Google tokens.

        Implementation follows next.
        """
        return {
            "status":"pending",
            "code":code,
        }