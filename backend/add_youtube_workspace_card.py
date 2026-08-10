from pathlib import Path
import shutil

path = Path("../admin-dashboard/app/dashboard/schools/[schoolId]/page.tsx")

backup = Path(str(path) + ".before-youtube-workspace-card")
if not backup.exists():
    shutil.copy2(path, backup)
    print(f"BACKUP: {backup}")

s = path.read_text(encoding="utf-8")

# Make sure MonitorPlay is imported.
if "MonitorPlay" not in s:
    # Add it to the existing lucide-react import.
    marker = 'from "lucide-react";'
    if marker in s:
        before, after = s.split(marker, 1)

        # Add MonitorPlay to the existing import list.
        if "import {" in before:
            before = before.rstrip()
            before = before.replace(
                "import {",
                "import {\n  MonitorPlay,",
                1,
            )
            s = before + "\n" + marker + after
        else:
            raise SystemExit(
                "ERROR: Could not safely locate lucide-react import."
            )
    else:
        raise SystemExit(
            "ERROR: lucide-react import not found. No changes made."
        )

# Don't add it twice.
if 'title: "YouTube Learning"' in s:
    print("ALREADY EXISTS: YouTube Learning workspace card")
else:
    # Insert immediately after the Internal Browser card.
    browser_card = '''{
  title: "Internal Browser",
  description: "Approved educational websites",
  icon: Globe,
  href: `/dashboard/schools/${schoolId}/browser`,
},'''

    youtube_card = '''

{
  title: "YouTube Learning",
  description: "Educational video resources",
  icon: MonitorPlay,
  href: `/dashboard/schools/${schoolId}/youtube-learning`,
},'''

    if browser_card not in s:
        raise SystemExit(
            "ERROR: Internal Browser card not found. "
            "No changes made."
        )

    s = s.replace(
        browser_card,
        browser_card + youtube_card,
        1,
    )

    print("ADDED: YouTube Learning workspace card")

path.write_text(s, encoding="utf-8")

print()
print("=" * 60)
print("YOUTUBE WORKSPACE CARD COMPLETE")
print("=" * 60)
print("The existing School Workspace cards were left untouched.")
print("YouTube Learning now points to:")
print("/dashboard/schools/${schoolId}/youtube-learning")
print()
print("BACKUP:", backup)
print("=" * 60)
