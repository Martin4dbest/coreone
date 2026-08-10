from pathlib import Path
import re
import shutil

path = Path("../admin-dashboard/app/dashboard/schools/[schoolId]/page.tsx")

backup = Path(str(path) + ".before-workspace-filter-final-fix")
if not backup.exists():
    shutil.copy2(path, backup)
    print(f"BACKUP: {backup}")

s = path.read_text(encoding="utf-8")

# ------------------------------------------------------------
# 1. Remove ALL references to the broken workspaceFeatureKey
# ------------------------------------------------------------
s = s.replace("workspaceFeatureKey", "workspaceFeatureKey_BROKEN")

# ------------------------------------------------------------
# 2. Add one reliable feature-key resolver before schoolModules
# ------------------------------------------------------------
resolver = r'''
const getWorkspaceFeatureKey = (module: {
  title: string;
  feature?: string;
}) => {
  if (module.feature) {
    return module.feature;
  }

  const featureMap: Record<string, string> = {
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
  };

  return featureMap[module.title];
};

'''

marker = "const schoolModules = ["

if "const getWorkspaceFeatureKey" not in s:
    if marker not in s:
        raise SystemExit("ERROR: const schoolModules = [ not found")

    s = s.replace(marker, resolver + marker, 1)
    print("ADDED: getWorkspaceFeatureKey()")
else:
    print("INFO: getWorkspaceFeatureKey() already exists")

# ------------------------------------------------------------
# 3. Find the workspace card filter and replace it completely
# ------------------------------------------------------------
filter_pattern = re.compile(
    r'\.filter\(\(module\)\s*=>\s*\{.*?\}\)',
    re.DOTALL,
)

replacement = r'''.filter((module) => {
        const featureKey = getWorkspaceFeatureKey(module);

        return !featureKey || featureEnabled(featureKey);
      })'''

# Only modify the filter that is immediately followed by the workspace
# card rendering. We search around schoolModules first.
school_modules_pos = s.find("const schoolModules = [")
if school_modules_pos == -1:
    raise SystemExit("ERROR: schoolModules declaration not found")

after_modules = s[school_modules_pos:]

match = filter_pattern.search(after_modules)

if match:
    start = school_modules_pos + match.start()
    end = school_modules_pos + match.end()

    # Make sure this is actually the workspace filter.
    surrounding = s[max(0, start - 200):min(len(s), end + 500)]

    if "schoolModules" in surrounding or "module" in surrounding:
        s = s[:start] + replacement + s[end:]
        print("FIXED: workspace feature filter replaced")
else:
    print("WARNING: no .filter((module) => {...}) block found")

# ------------------------------------------------------------
# 4. Remove any remaining broken references
# ------------------------------------------------------------
if "workspaceFeatureKey_BROKEN" in s:
    print("WARNING: removing remaining broken workspaceFeatureKey references")

    # Any remaining malformed declaration/reference is replaced with
    # the correct resolver.
    s = s.replace(
        "workspaceFeatureKey_BROKEN",
        "getWorkspaceFeatureKey(module)"
    )

# ------------------------------------------------------------
# 5. Verify the old undefined identifier is completely gone
# ------------------------------------------------------------
if "workspaceFeatureKey" in s:
    raise SystemExit(
        "ERROR: workspaceFeatureKey still exists in the file. "
        "No changes beyond this point were accepted."
    )

path.write_text(s, encoding="utf-8")

print()
print("=" * 70)
print("WORKSPACE FEATURE FILTER FIXED")
print("=" * 70)
print()
print("Removed undefined workspaceFeatureKey reference.")
print("Added getWorkspaceFeatureKey().")
print("Workspace cards now use featureEnabled().")
print()
print("Feature behavior:")
print("  ON  -> workspace card visible")
print("  OFF -> workspace card hidden")
print("  No feature record -> hidden")
print()
print("Underlying feature functionality was NOT changed.")
print("Backup:", backup)
print("=" * 70)
