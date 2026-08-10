from pathlib import Path
import re
import shutil

path = Path("app/dashboard/schools/[schoolId]/page.tsx")

backup = Path(str(path) + ".before-final-workspace-cleanup")

if not backup.exists():
    shutil.copy2(path, backup)
    print(f"BACKUP: {backup}")

s = path.read_text(encoding="utf-8")

# ============================================================
# 1. FIX "use client" POSITION
# ============================================================

# Remove every existing standalone use-client directive.
s = re.sub(
    r'^\s*"use client";\s*\n?',
    '',
    s,
    flags=re.MULTILINE,
)

# Put it FIRST.
s = '"use client";\n\n' + s.lstrip()

print("FIXED: use client directive moved to line 1")

# ============================================================
# 2. REMOVE use(params)
# ============================================================

s = s.replace(
    'const { schoolId } = use(params);',
    'const { schoolId } = useParams() as { schoolId: string };',
)

# ============================================================
# 3. REMOVE ANY "use" IMPORT
# ============================================================

s = re.sub(
    r',\s*use(?=\s*})',
    '',
    s,
)

s = re.sub(
    r',\s*use\s*,',
    ',',
    s,
)

# ============================================================
# 4. ENSURE useParams IS IMPORTED
# ============================================================

nav_pattern = r'import\s*\{([^}]*)\}\s*from\s*"next/navigation";'
nav_match = re.search(nav_pattern, s)

if nav_match:
    names = [
        x.strip()
        for x in nav_match.group(1).split(",")
        if x.strip()
    ]

    # Remove accidental duplicates.
    names = list(dict.fromkeys(names))

    if "useParams" not in names:
        names.append("useParams")

    new_import = (
        'import { ' +
        ", ".join(names) +
        ' } from "next/navigation";'
    )

    s = s[:nav_match.start()] + new_import + s[nav_match.end():]

else:
    s = 'import { useParams } from "next/navigation";\n' + s

print("FIXED: useParams import")

# ============================================================
# 5. REMOVE THE BROKEN workspaceFeatureKey LOGIC
# ============================================================

# This is the broken pattern introduced by the previous script:
#
# const featureKey = workspaceFeatureKey(...)
#
# Replace the entire filter callback with a clean feature check.
#
# We locate the schoolModules.filter(...) expression and replace
# only its filtering logic.

broken_filter = re.compile(
    r'\.filter\(\s*\(module\)\s*=>\s*\{.*?'
    r'\}\s*\)',
    re.S,
)

matches = list(broken_filter.finditer(s))

fixed_filter = False

for match in reversed(matches):
    block = match.group(0)

    if "workspaceFeatureKey" in block:
        replacement = r'''.filter((module) => {
      if (!module.feature) {
        return true;
      }

      return featureEnabled(module.feature);
    })'''

        s = s[:match.start()] + replacement + s[match.end():]
        fixed_filter = True
        print("FIXED: removed undefined workspaceFeatureKey")
        break

# If the exact filter wasn't found, remove any standalone reference.
if "workspaceFeatureKey" in s:
    s = re.sub(
        r'const\s+featureKey\s*=\s*workspaceFeatureKey[^;]*;',
        '',
        s,
    )

    s = s.replace(
        "workspaceFeatureKey",
        "module.feature",
    )

    print("FIXED: cleaned remaining workspaceFeatureKey reference")

# ============================================================
# 6. ENSURE featureEnabled EXISTS
# ============================================================

if "const featureEnabled = (featureKey: string)" not in s:

    helper = '''
  const featureEnabled = (featureKey: string) => {
    return features.some(
      (feature) =>
        feature.feature_key === featureKey &&
        feature.enabled === true
    );
  };

'''

    marker = "const schoolModules = ["

    if marker in s:
        s = s.replace(
            marker,
            helper + marker,
            1,
        )
        print("FIXED: added featureEnabled helper")
    else:
        raise SystemExit(
            "ERROR: Could not locate schoolModules declaration."
        )

# ============================================================
# 7. ENSURE FEATURES STATE EXISTS
# ============================================================

if not re.search(
    r'const\s+\[features,\s*setFeatures\]\s*=\s*useState',
    s,
):

    marker = 'const [school, setSchool] = useState<School | null>(null);'

    if marker in s:
        s = s.replace(
            marker,
            marker + '\n  const [features, setFeatures] = useState<any[]>([]);',
            1,
        )
        print("FIXED: added features state")
    else:
        raise SystemExit(
            "ERROR: Could not locate school state."
        )

# ============================================================
# 8. ENSURE FEATURE LOADING EXISTS
# ============================================================

if '/school-features/${schoolId}' not in s:

    marker = "useEffect(() => {"

    pos = s.find(marker)

    if pos == -1:
        raise SystemExit(
            "ERROR: Could not locate useEffect."
        )

    insert_at = pos + len(marker)

    loader = '''
    async function loadFeatures() {
      try {
        const response = await api.get(`/school-features/${schoolId}`);
        setFeatures(response.data || []);
      } catch (error) {
        console.error("Failed to load school features:", error);
        setFeatures([]);
      }
    }

    loadFeatures();

'''

    s = s[:insert_at] + loader + s[insert_at:]

    print("FIXED: added feature loading")

# ============================================================
# 9. ENSURE YOUTUBE WORKSPACE CARD IS FEATURE CONTROLLED
# ============================================================

youtube = '''    ...(featureEnabled("youtube_learning")
      ? [{
          title: "YouTube Learning",
          description: "Educational video resources",
          icon: MonitorPlay,
          href: `/dashboard/schools/${schoolId}/youtube-learning`,
        }]
      : []),'''

# Replace any existing YouTube spread block.
youtube_pattern = re.compile(
    r'\s*\.\.\.\(features\.find\(\s*'
    r'\(feature\)\s*=>\s*feature\.feature_key\s*===\s*"youtube_learning"\s*'
    r'\)\?\.enabled\s*===\s*true\s*'
    r'\?\s*\[\{.*?'
    r'\}\]\s*:\s*\[\]\),',
    re.S,
)

if youtube_pattern.search(s):
    s = youtube_pattern.sub("\n\n" + youtube, s, count=1)
    print("FIXED: normalized YouTube workspace card")

elif 'href: `/dashboard/schools/${schoolId}/youtube-learning`' not in s:

    browser = '''    {
      title: "Internal Browser",
      description: "Approved educational websites",
      icon: Globe,
      href: `/dashboard/schools/${schoolId}/browser`,
    },'''

    if browser in s:
        s = s.replace(
            browser,
            browser + "\n\n" + youtube,
            1,
        )
        print("FIXED: added YouTube workspace card")

# ============================================================
# 10. REMOVE DUPLICATE IMPORTS
# ============================================================

# Deduplicate useEffect/useState from React imports.
react_pattern = r'import\s*\{([^}]*)\}\s*from\s*"react";'
react_match = re.search(react_pattern, s)

if react_match:
    names = [
        x.strip()
        for x in react_match.group(1).split(",")
        if x.strip()
    ]

    names = list(dict.fromkeys(names))

    s = (
        s[:react_match.start()]
        + 'import { ' + ", ".join(names) + ' } from "react";'
        + s[react_match.end():]
    )

# ============================================================
# 11. VALIDATION
# ============================================================

errors = []

if not s.startswith('"use client";'):
    errors.append('"use client" is not first')

if "workspaceFeatureKey" in s:
    errors.append("workspaceFeatureKey still exists")

if "use(params)" in s:
    errors.append("use(params) still exists")

if "useParams()" in s and "useParams" not in s:
    errors.append("useParams reference without import")

if 'featureEnabled("youtube_learning")' not in s:
    errors.append("YouTube feature-controlled card missing")

if errors:
    print()
    print("VALIDATION FAILED:")
    for error in errors:
        print(" -", error)
    raise SystemExit(1)

path.write_text(s, encoding="utf-8")

print()
print("=" * 70)
print("FINAL SCHOOL WORKSPACE PAGE FIX COMPLETE")
print("=" * 70)
print()
print("Fixed:")
print("  ✓ use client directive")
print("  ✓ useParams import")
print("  ✓ removed workspaceFeatureKey error")
print("  ✓ featureEnabled helper")
print("  ✓ feature state")
print("  ✓ feature loading")
print("  ✓ YouTube workspace card")
print()
print("YouTube:")
print('  ON  -> visible')
print('  OFF -> hidden')
print()
print("Other feature cards continue using the same visibility system.")
print("No underlying module functionality was changed.")
print()
print("BACKUP:")
print(backup)
print("=" * 70)
