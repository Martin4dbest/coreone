from pathlib import Path
import re
import shutil

path = Path("../admin-dashboard/app/dashboard/schools/[schoolId]/page.tsx")

backup = Path(str(path) + ".before-react-use-fix")
if not backup.exists():
    shutil.copy2(path, backup)
    print(f"BACKUP: {backup}")

s = path.read_text(encoding="utf-8")

# Remove duplicate React hook imports involving useEffect/useState/use.
# Then create one clean React import.
s = re.sub(
    r'import\s*\{\s*[^}]*\buseEffect\b[^}]*\}\s*from\s*["\']react["\'];?\s*',
    '',
    s,
    count=1,
    flags=re.S,
)

s = re.sub(
    r'import\s*\{\s*[^}]*\buseState\b[^}]*\}\s*from\s*["\']react["\'];?\s*',
    '',
    s,
    count=1,
    flags=re.S,
)

# Remove any leftover duplicate React import lines.
s = re.sub(
    r'import\s*\{\s*useEffect\s*,\s*useState(?:\s*,\s*use)?\s*\}\s*from\s*["\']react["\'];?\s*',
    '',
    s,
)

# Put one correct React import at the top.
s = 'import { useEffect, useState, use } from "react";\n' + s.lstrip()

path.write_text(s, encoding="utf-8")

print("FIXED: React imports normalized")
print("FIXED: use(params) now has React use imported")
print(f"BACKUP: {backup}")
