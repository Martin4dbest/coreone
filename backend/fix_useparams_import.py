from pathlib import Path
import re

path = Path("../admin-dashboard/app/dashboard/schools/[schoolId]/page.tsx")

s = path.read_text(encoding="utf-8")

# Make sure useParams is imported from next/navigation.
if 'from "next/navigation"' in s:
    pattern = r'import\s*\{([^}]*)\}\s*from\s*"next/navigation";'

    match = re.search(pattern, s)

    if match:
        names = [
            x.strip()
            for x in match.group(1).split(",")
            if x.strip()
        ]

        if "useParams" not in names:
            names.append("useParams")

        new_import = (
            'import { '
            + ", ".join(names)
            + ' } from "next/navigation";'
        )

        s = s[:match.start()] + new_import + s[match.end():]

        print("FIXED: added useParams to next/navigation import")

    else:
        raise SystemExit(
            "ERROR: Could not parse next/navigation import."
        )

else:
    # Add the import near the top.
    s = 'import { useParams } from "next/navigation";\n' + s
    print("FIXED: created next/navigation import")

path.write_text(s, encoding="utf-8")

print()
print("=" * 60)
print("useParams FIX COMPLETE")
print("=" * 60)
print()
print("School Workspace feature logic was NOT changed.")
print("Feature visibility logic was NOT changed.")
print("=" * 60)
