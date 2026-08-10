from pathlib import Path
import shutil
import re

path = Path("app/dashboard/schools/[schoolId]/page.tsx")

backup = Path(str(path) + ".before-feature-state-fix")

if not backup.exists():
    shutil.copy2(path, backup)
    print(f"BACKUP: {backup}")

s = path.read_text(encoding="utf-8")

# ------------------------------------------------------------
# 1. Remove the unused duplicate schoolFeatures state.
# ------------------------------------------------------------

s = re.sub(
    r'^\s*const schoolFeatures = useState<any\[\]>\(\[\]\);\s*$',
    '',
    s,
    flags=re.MULTILINE,
)

# The actual source has:
# const [schoolFeatures, setSchoolFeatures] = useState<any[]>([]);
s = re.sub(
    r'^\s*const \[schoolFeatures,\s*setSchoolFeatures\] = useState<any\[\]>\(\[\]\);\s*$',
    '',
    s,
    flags=re.MULTILINE,
)

# ------------------------------------------------------------
# 2. Make featureEnabled use the SAME `features` state that
#    loadFeatures() populates.
# ------------------------------------------------------------

old = '''const featureEnabled = (featureKey: string) => {
return schoolFeatures.some(
(feature) =>
feature.feature_key === featureKey &&
feature.enabled === true
);
};'''

new = '''const featureEnabled = (featureKey: string) => {
  return features.some(
    (feature) =>
      feature.feature_key === featureKey &&
      feature.enabled === true
  );
};'''

if old in s:
    s = s.replace(old, new, 1)
    print("FIXED: featureEnabled now uses features state")
else:
    # Handle formatting variations safely.
    pattern = re.compile(
        r'const featureEnabled\s*=\s*\(featureKey:\s*string\)\s*=>\s*\{'
        r'[\s\S]*?'
        r'\n\};',
        re.MULTILINE,
    )

    match = pattern.search(s)

    if not match:
        raise SystemExit(
            "ERROR: Could not find featureEnabled()."
        )

    replacement = '''const featureEnabled = (featureKey: string) => {
  return features.some(
    (feature) =>
      feature.feature_key === featureKey &&
      feature.enabled === true
  );
};'''

    s = s[:match.start()] + replacement + s[match.end():]
    print("FIXED: featureEnabled replaced using features state")

# ------------------------------------------------------------
# 3. Make sure there is only one featureEnabled helper.
# ------------------------------------------------------------

if s.count("const featureEnabled") != 1:
    raise SystemExit(
        f"ERROR: Expected exactly one featureEnabled helper; "
        f"found {s.count('const featureEnabled')}"
    )

# ------------------------------------------------------------
# 4. Make sure there is only one visibleSchoolModules filter.
# ------------------------------------------------------------

if s.count("const visibleSchoolModules") != 1:
    raise SystemExit(
        f"ERROR: Expected exactly one visibleSchoolModules declaration; "
        f"found {s.count('const visibleSchoolModules')}"
    )

# ------------------------------------------------------------
# 5. Remove accidental references to schoolFeatures.
# ------------------------------------------------------------

if "schoolFeatures" in s:
    raise SystemExit(
        "ERROR: schoolFeatures references still remain. "
        "Stopping instead of making an unsafe replacement."
    )

# ------------------------------------------------------------
# 6. Verify the feature API still exists.
# ------------------------------------------------------------

if 'api.get(`/school-features/${schoolId}`)' not in s:
    raise SystemExit(
        "ERROR: Workspace feature API request is missing."
    )

# ------------------------------------------------------------
# 7. Verify YouTube is feature-controlled.
# ------------------------------------------------------------

if 'feature: "youtube_learning"' not in s:
    raise SystemExit(
        "ERROR: YouTube Learning feature key is missing."
    )

path.write_text(s, encoding="utf-8")

print()
print("=" * 70)
print("WORKSPACE FEATURE STATE FIX COMPLETE")
print("=" * 70)
print()
print("Feature source:")
print("  GET /school-features/{schoolId}")
print("          ↓")
print("      features")
print("          ↓")
print("   featureEnabled()")
print("          ↓")
print(" visibleSchoolModules")
print()
print("Workspace and sidebar now use the same feature state.")
print()
print("YouTube Learning:")
print("  ON  -> workspace card visible")
print("  OFF -> workspace card hidden")
print()
print("Ebooks:")
print("  ON  -> workspace card visible")
print("  OFF -> workspace card hidden")
print()
print("All other feature-controlled modules follow the same rule.")
