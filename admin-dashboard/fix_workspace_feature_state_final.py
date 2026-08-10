from pathlib import Path
import shutil
import re

path = Path("app/dashboard/schools/[schoolId]/page.tsx")

backup = Path(str(path) + ".before-feature-state-final")

if not backup.exists():
    shutil.copy2(path, backup)
    print(f"BACKUP: {backup}")

s = path.read_text(encoding="utf-8")

# ------------------------------------------------------------
# A. Remove the unused/incorrect schoolFeatures state.
# ------------------------------------------------------------

s = re.sub(
    r'\n\s*const \[schoolFeatures,\s*setSchoolFeatures\]\s*=\s*useState<any\[\]>\(\[\]\);',
    '',
    s,
)

# Also handle formatting variations.
s = re.sub(
    r'\n\s*const \[schoolFeatures,\s*setSchoolFeatures\]\s*=\s*useState<[^;]+;\s*',
    '\n',
    s,
)

# ------------------------------------------------------------
# B. Make featureEnabled use the REAL loaded features state.
# ------------------------------------------------------------

old_patterns = [
r'const featureEnabled = \(featureKey: string\) => \{\s*return schoolFeatures\.some\(\s*\(feature\) =>\s*feature\.feature_key === featureKey &&\s*feature\.enabled === true\s*\);\s*\};',
r'const featureEnabled = \(featureKey: string\) => \{\s*return schoolFeatures\.some\(\s*\(feature\) =>\s*feature\.feature_key === featureKey &&\s*feature\.enabled === true\s*\)\s*;\s*\};',
]

new_helper = '''const featureEnabled = (featureKey: string) => {
  return features.some(
    (feature) =>
      feature.feature_key === featureKey &&
      feature.enabled === true
  );
};'''

replaced = False

for pattern in old_patterns:
    s2, count = re.subn(pattern, new_helper, s)
    if count:
        s = s2
        replaced = True
        print("FIXED: workspace featureEnabled now uses features[]")
        break

# If the exact formatting was different, replace the helper by boundaries.
if not replaced:
    start = s.find("const featureEnabled = (featureKey: string) => {")
    if start != -1:
        end = s.find("\n};", start)
        if end != -1:
            end += 3
            s = s[:start] + new_helper + s[end:]
            replaced = True
            print("FIXED: workspace featureEnabled helper replaced")

if not replaced:
    raise SystemExit("ERROR: Could not locate featureEnabled helper")

# ------------------------------------------------------------
# C. Make sure there is only ONE featureEnabled helper.
# ------------------------------------------------------------

first = s.find("const featureEnabled = (featureKey: string) => {")

if first != -1:
    search_from = first + 1
    while True:
        duplicate = s.find(
            "const featureEnabled = (featureKey: string) => {",
            search_from,
        )
        if duplicate == -1:
            break

        end = s.find("\n};", duplicate)
        if end == -1:
            raise SystemExit(
                "ERROR: Duplicate featureEnabled found but closing was not found"
            )

        end += 3
        s = s[:duplicate] + s[end:]
        print("REMOVED: duplicate featureEnabled helper")

        search_from = duplicate

# ------------------------------------------------------------
# D. Ensure YouTube is a normal feature-controlled module.
# ------------------------------------------------------------

youtube_pattern = r'\{\s*title:\s*"YouTube Learning",\s*feature:\s*"youtube_learning",\s*description:\s*"Educational video resources",\s*icon:\s*MonitorPlay,\s*href:\s*`/dashboard/schools/\$\{schoolId\}/youtube-learning`,\s*\},?'

youtube_replacement = '''{
  title: "YouTube Learning",
  feature: "youtube_learning",
  description: "Educational video resources",
  icon: MonitorPlay,
  href: `/dashboard/schools/${schoolId}/youtube-learning`,
},'''

s, youtube_count = re.subn(
    youtube_pattern,
    youtube_replacement,
    s,
    flags=re.MULTILINE,
)

if youtube_count:
    print("FIXED: YouTube Learning is feature-controlled")

# ------------------------------------------------------------
# E. Ensure exactly one visibleSchoolModules filter exists.
# ------------------------------------------------------------

filter_start = s.find("const visibleSchoolModules = schoolModules.filter(")

if filter_start == -1:
    # Insert immediately after schoolModules closing before toggleSchool.
    marker = "\nasync function toggleSchool()"
    pos = s.find(marker)

    if pos == -1:
        raise SystemExit(
            "ERROR: Could not find insertion point for visibleSchoolModules"
        )

    visible = '''
const visibleSchoolModules = schoolModules.filter((module) => {
  // No feature key = role-controlled module.
  if (!module.feature) {
    return true;
  }

  // Feature-controlled module = visible only when enabled.
  return featureEnabled(module.feature);
});

'''

    s = s[:pos] + "\n" + visible + s[pos:]
    print("ADDED: canonical visibleSchoolModules filter")
else:
    print("OK: visibleSchoolModules filter already exists")

# ------------------------------------------------------------
# F. Remove any duplicate visibleSchoolModules declarations.
# ------------------------------------------------------------

first_filter = s.find("const visibleSchoolModules = schoolModules.filter(")

if first_filter != -1:
    search_from = first_filter + 1

    while True:
        duplicate = s.find(
            "const visibleSchoolModules = schoolModules.filter(",
            search_from,
        )

        if duplicate == -1:
            break

        # Find end of filter by locating "\n);" after duplicate.
        end = s.find("\n);", duplicate)

        if end == -1:
            raise SystemExit(
                "ERROR: Duplicate visibleSchoolModules found but closing was not found"
            )

        end += 3
        s = s[:duplicate] + s[end:]
        print("REMOVED: duplicate visibleSchoolModules")

        search_from = duplicate

path.write_text(s, encoding="utf-8")

print()
print("================================================")
print("WORKSPACE FEATURE STATE FIX COMPLETE")
print("================================================")
print("Workspace now uses:")
print("  features[]")
print()
print("Feature-controlled cards:")
print("  students")
print("  teachers")
print("  staff")
print("  academics")
print("  attendance")
print("  results")
print("  events")
print("  learning")
print("  cbt")
print("  ebooks")
print("  browser")
print("  youtube_learning")
print()
print("Role-only cards remain role-controlled.")
print("================================================")
