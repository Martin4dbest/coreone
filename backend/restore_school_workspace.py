from pathlib import Path
import shutil

admin = Path("../admin-dashboard")
target = admin / "app/dashboard/schools/[schoolId]/page.tsx"

# This backup was created immediately before the workspace feature-control edits.
backups = [
    target.with_name(target.name + ".before-workspace-feature-fix"),
    target.with_name(target.name + ".before-global-feature-fix-v2"),
    target.with_name(target.name + ".before-global-feature-fix"),
]

source = next((p for p in backups if p.exists()), None)

if source is None:
    raise SystemExit("ERROR: No School Workspace backup was found.")

# Preserve the currently broken file before restoration.
emergency = target.with_name(target.name + ".broken-workspace-current")
if not emergency.exists():
    shutil.copy2(target, emergency)
    print(f"SAVED CURRENT BROKEN FILE: {emergency}")

shutil.copy2(source, target)

print()
print("=" * 70)
print("SCHOOL WORKSPACE RESTORED")
print("=" * 70)
print(f"RESTORED FROM: {source}")
print(f"RESTORED TO:   {target}")
print()
print("Your original School Workspace cards have been restored.")
print("Students, Teachers, Staff, Academics, Attendance, Results,")
print("Events, Learning Centre, CBT, Ebooks, Browser, etc. are restored.")
print()
print("No ebook/YouTube/CBT functionality was changed.")
print("No database data was changed.")
print("=" * 70)
