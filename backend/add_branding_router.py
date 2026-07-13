from pathlib import Path

path = Path("app/main.py")

content = path.read_text()

import_line = "from app.modules.branding.router import router as branding_router\n"

if import_line not in content:
    marker = "from app.modules.settings.router import router as settings_router\n"
    content = content.replace(
        marker,
        marker + import_line
    )

router_block = """app.include_router(
    branding_router,
    prefix=settings.API_V1_STR,
)
"""

if router_block not in content:
    marker = """app.include_router(
    settings_router,
    prefix=settings.API_V1_STR,
)
"""
    content = content.replace(
        marker,
        marker + router_block
    )

path.write_text(content)

print("✅ Branding router registered successfully")
