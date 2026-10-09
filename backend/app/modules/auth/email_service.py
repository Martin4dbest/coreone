import resend

from app.core.config import settings


def send_password_reset_email(
    email: str,
    reset_token: str,
    frontend_url: str | None = None,
) -> None:
    resend.api_key = settings.RESEND_API_KEY

    base_url = (frontend_url or settings.FRONTEND_URL).rstrip('/')

    reset_url = f"{base_url}/reset-password?token={reset_token}"

    resend.Emails.send({
        "from": settings.EMAIL_FROM,
        "to": [email],
        "subject": "Reset your CoreOne password",
        "html": f"""
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h2>Reset your CoreOne password</h2>
                <p>We received a request to reset your password.</p>
                <p><a href="{reset_url}" style="display:inline-block;padding:12px 20px;background:#e11d48;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;">Reset Password</a></p>
                <p>This link expires in 15 minutes.</p>
                <p>If you did not request a password reset, you can ignore this email.</p>
            </div>
        """,
    })
