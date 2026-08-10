from pathlib import Path
import shutil
import re

path = Path("app/dashboard/schools/[schoolId]/page.tsx")
backup = Path(str(path) + ".before-duplicate-feature-cleanup")

if not backup.exists():
    shutil.copy2(path, backup)
    print(f"BACKUP: {backup}")

s = path.read_text(encoding="utf-8")

# Remove duplicate consecutive feature declarations inside
# the workspace module objects.
#
# Example:
#   feature: "students",
#   description: "...",
#   ...
#   href: "...",
#   feature: "students",
#
# becomes:
#   feature: "students",
#   description: "...",
#   ...
#   href: "...",

feature_keys = [
    "students",
    "teachers",
    "staff",
    "attendance",
    "results",
    "events",
    "learning",
    "cbt",
    "ebooks",
    "browser",
]

for key in feature_keys:
    pattern = (
        rf'(\n\s*feature:\s*"{re.escape(key)}",)'
        rf'(?P<body>.*?)'
        rf'(\n\s*feature:\s*"{re.escape(key)}",)'
    )

    def remove_duplicate(match):
        return match.group(1) + match.group("body")

    s, count = re.subn(
        pattern,
        remove_duplicate,
        s,
        flags=re.DOTALL,
    )

    if count:
        print(f"REMOVED duplicate feature: {key} ({count})")

path.write_text(s, encoding="utf-8")

print("SUCCESS: Duplicate workspace feature properties removed.")
