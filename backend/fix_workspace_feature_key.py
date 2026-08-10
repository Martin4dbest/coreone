from pathlib import Path
import shutil
import re

path = Path("../admin-dashboard/app/dashboard/schools/[schoolId]/page.tsx")

backup = Path(str(path) + ".before-workspace-feature-key-fix")
if not backup.exists():
    shutil.copy2(path, backup)
    print(f"BACKUP: {backup}")

s = path.read_text(encoding="utf-8")

# Fix the broken filter callback:
#
#   .filter((module) => {
#       featureKey = workspaceFeatureKey...
#
# The feature key must come from the module's own feature property,
# with a title-based fallback for existing workspace cards.

old = re.compile(
    r'\.filter\(\(module\) => \{\s*'
    r'(?:const\s+)?workspaceFeatureKey\s*=\s*workspaceFeatureKey[^;]*;\s*'
    r'return\s+!workspaceFeatureKey\s*\|\|\s*featureEnabled\(workspaceFeatureKey\);\s*'
    r'\}\)',
    re.MULTILINE,
)

new = '''.filter((module) => {
        const workspaceFeatureKey =
          module.feature ??
          ({
            Students: "students",
            Teachers: "teachers",
            Staff: "staff",
            Classes: "classes",
            Academics: "academics",
            Attendance: "attendance",
            "Learning Centre": "learning",
            CBT: "cbt",
            Ebooks: "ebooks",
            "Internal Browser": "browser",
            "YouTube Learning": "youtube_learning",
            Results: "results",
            Events: "events",
            Settings: "settings",
            Branding: "branding",
          } as Record<string, string>)[module.title];

        return (
          !workspaceFeatureKey ||
          featureEnabled(workspaceFeatureKey)
        );
      })'''

if old.search(s):
    s = old.sub(new, s)
    print("FIXED: broken workspaceFeatureKey reference")
else:
    # Handle the common malformed form more broadly.
    malformed = re.compile(
        r'\.filter\(\(module\)\s*=>\s*\{.*?'
        r'return\s+!workspaceFeatureKey\s*\|\|\s*featureEnabled\(workspaceFeatureKey\);'
        r'.*?\}\)',
        re.DOTALL,
    )

    if malformed.search(s):
        s = malformed.sub(new, s, count=1)
        print("FIXED: malformed workspace feature filter")
    else:
        print("WARNING: workspace filter pattern not found")

path.write_text(s, encoding="utf-8")

print("UPDATED:", path)
print("Underlying feature functionality was not changed.")
print("Only workspace visibility filtering was repaired.")
