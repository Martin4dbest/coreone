from pathlib import Path
import shutil

page = Path("../admin-dashboard/app/dashboard/schools/[schoolId]/page.tsx")
backup = Path(
    "../admin-dashboard/app/dashboard/schools/[schoolId]/page.tsx"
    ".before-global-feature-fix-v2"
)

if not backup.exists():
    raise SystemExit(f"ERROR: backup not found: {backup}")

# Keep a copy of the currently broken file before restoring.
broken_backup = Path(
    "../admin-dashboard/app/dashboard/schools/[schoolId]/page.tsx"
    ".broken-feature-fix"
)

if not broken_backup.exists():
    shutil.copy2(page, broken_backup)
    print(f"SAVED BROKEN VERSION: {broken_backup}")

shutil.copy2(backup, page)

print()
print("RESTORED:")
print(page)
print()
print("FROM:")
print(backup)
print()
print("The syntax error from the v2 feature patch has been removed.")
print("The actual feature functionality has NOT been touched.")
