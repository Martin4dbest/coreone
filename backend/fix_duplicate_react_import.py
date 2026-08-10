from pathlib import Path

page = Path("../admin-dashboard/app/dashboard/schools/[schoolId]/page.tsx")

s = page.read_text(encoding="utf-8")

# Remove every existing React hook import line that imports useEffect/useState.
lines = s.splitlines()

cleaned = []
for line in lines:
    stripped = line.strip()

    if stripped.startswith("import {") and (
        "useEffect" in stripped or "useState" in stripped
    ) and 'from "react"' in stripped:
        continue

    cleaned.append(line)

s = "\n".join(cleaned)

# Add ONE clean React hooks import immediately after "use client".
react_import = 'import { useEffect, useState } from "react";'

if '"use client";' in s:
    s = s.replace(
        '"use client";',
        '"use client";\n\n' + react_import,
        1,
    )
else:
    s = react_import + "\n\n" + s

# Remove accidental duplicate blank lines at the top.
while "\n\n\n\n" in s:
    s = s.replace("\n\n\n\n", "\n\n\n")

page.write_text(s, encoding="utf-8")

print("FIXED: duplicate React hook imports")
print()
print("React imports at top of file:")
for i, line in enumerate(s.splitlines()[:12], 1):
    print(f"{i}: {line}")
