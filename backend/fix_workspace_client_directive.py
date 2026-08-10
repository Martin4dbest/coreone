from pathlib import Path
import shutil

path = Path("../admin-dashboard/app/dashboard/schools/[schoolId]/page.tsx")

backup = Path(str(path) + ".before-client-directive-fix")
if not backup.exists():
    shutil.copy2(path, backup)
    print(f"BACKUP: {backup}")

s = path.read_text(encoding="utf-8")

# Remove any existing "use client" directives.
s = s.replace('"use client";\n', "")
s = s.replace("'use client';\n", "")
s = s.replace('"use client"\n', "")
s = s.replace("'use client'\n", "")

# Remove any accidental duplicate React import lines.
lines = s.splitlines()
react_imports = []
other_lines = []

for line in lines:
    if 'from "react"' in line or "from 'react'" in line:
        react_imports.append(line.strip())
    else:
        other_lines.append(line)

# Build one clean React import.
react_import = 'import { useEffect, useState, use } from "react";'

# Remove blank lines at the beginning.
while other_lines and not other_lines[0].strip():
    other_lines.pop(0)

# "use client" MUST be the first statement.
new_content = '"use client";\n\n' + react_import + "\n"

# Preserve the rest of the file, excluding old React imports.
new_content += "\n".join(other_lines).lstrip() + "\n"

path.write_text(new_content, encoding="utf-8")

print("FIXED: 'use client' moved to line 1")
print("FIXED: React hooks imported after the client directive")
print(f"BACKUP: {backup}")
