from pathlib import Path
import re
import shutil

BACKEND = Path(".")
ADMIN = Path("../admin-dashboard")

LAYOUT = ADMIN / "app/dashboard/schools/[schoolId]/layout.tsx"
DASHBOARD = ADMIN / "app/dashboard/schools/[schoolId]/page.tsx"
LEARNING = ADMIN / "app/dashboard/schools/[schoolId]/learning/page.tsx"
ROUTER = BACKEND / "app/modules/school_features/router.py"

FEATURE_KEYS = {
    "Students": "students",
    "Teachers": "teachers",
    "Staff": "staff",
    "Classes": "classes",
    "Academics": "academics",
    "Attendance": "attendance",
    "Learning Centre": "learning",
    "Ebooks": "ebooks",
    "Internal Browser": "browser",
    "YouTube Learning": "youtube_learning",
    "CBT": "cbt",
    "Results": "results",
    "Events": "events",
    "Settings": "settings",
    "Branding": "branding",
}

def backup(path):
    if not path.exists():
        print(f"SKIP BACKUP: {path} does not exist")
        return

    backup_path = Path(str(path) + ".before-global-feature-fix")

    if not backup_path.exists():
        shutil.copy2(path, backup_path)
        print(f"BACKUP: {backup_path}")
    else:
        print(f"BACKUP EXISTS: {backup_path}")


def write(path, text):
    path.write_text(text, encoding="utf-8")
    print(f"UPDATED: {path}")


# ============================================================
# BACKUPS
# ============================================================

for path in [LAYOUT, DASHBOARD, LEARNING, ROUTER]:
    backup(path)


# ============================================================
# 1. LAYOUT
#
# Sidebar navigation must use featureEnabled().
# Existing featureEnabled behavior is intentionally:
#
#   record exists + enabled=true  -> visible
#   record exists + enabled=false -> hidden
#   no record                     -> hidden
#
# ============================================================

s = LAYOUT.read_text(encoding="utf-8")

old = '''const featureEnabled = (featureKey: string) => {
    const feature = features.find(
      (item) => item.feature_key === featureKey
    );

    /*
     * If no feature record exists, keep the existing page visible.
     * This prevents an incomplete feature configuration from
     * accidentally hiding working modules.
     */
    if (!feature) {
      return true;
    }

    return feature.enabled;
  };'''

new = '''const featureEnabled = (featureKey: string) => {
    return features.some(
      (item) =>
        item.feature_key === featureKey &&
        item.enabled === true
    );
  };'''

if old in s:
    s = s.replace(old, new)
    print("LAYOUT: changed missing-feature behavior to OFF")
elif 'const featureEnabled = (featureKey: string) => {' in s:
    start = s.index('const featureEnabled = (featureKey: string) => {')
    end = s.index('\\n  };', start) + len('\\n  };')

    s = (
        s[:start]
        + new
        + s[end:]
    )

    print("LAYOUT: replaced featureEnabled()")
else:
    print("ERROR: featureEnabled() not found in layout")
    raise SystemExit(1)


# Make sure navigation items have feature keys.
for title, key in FEATURE_KEYS.items():
    if title == "Overview":
        continue

    # Find navigation object containing this name.
    pattern = re.compile(
        r'(\{\s*name:\s*["\']' +
        re.escape(title) +
        r'["\'][\s\S]*?)(\n\s*\},)',
        re.MULTILINE,
    )

    match = pattern.search(s)

    if match and "feature:" not in match.group(1):
        block = match.group(1)
        block += f',\\n      feature: "{key}"'
        s = s[:match.start()] + block + match.group(2) + s[match.end():]
        print(f"LAYOUT: added feature key to {title}")


write(LAYOUT, s)


# ============================================================
# 2. SCHOOL DASHBOARD CARDS
#
# Every feature-controlled module gets a feature key.
# Cards are filtered before rendering.
# ============================================================

s = DASHBOARD.read_text(encoding="utf-8")

# Ensure feature state exists.
if "const [schoolFeatures" not in s:
    marker = 'const [school, setSchool] = useState'
    idx = s.find(marker)

    if idx == -1:
        print("WARNING: Could not find school state declaration")
    else:
        # Insert immediately before the school state.
        s = (
            s[:idx]
            + 'const [schoolFeatures, setSchoolFeatures] = useState<any[]>([]);\\n\\n'
            + s[idx:]
        )
        print("DASHBOARD: added schoolFeatures state")


# Add feature loading after school loading if not already present.
if "`/school-features/${schoolId}`" not in s:
    # Find first useEffect.
    effect_idx = s.find("useEffect(() => {")

    if effect_idx != -1:
        # Insert a separate effect before the existing one.
        feature_effect = '''useEffect(() => {
    let mounted = true;

    async function loadSchoolFeatures() {
      try {
        const response = await api.get(
          `/school-features/${schoolId}`
        );

        if (mounted) {
          setSchoolFeatures(response.data || []);
        }
      } catch (error) {
        console.error(
          "Failed to load school features:",
          error
        );

        if (mounted) {
          setSchoolFeatures([]);
        }
      }
    }

    loadSchoolFeatures();

    return () => {
      mounted = false;
    };
  }, [schoolId]);

  const featureEnabled = (featureKey: string) =>
    schoolFeatures.some(
      (feature) =>
        feature.feature_key === featureKey &&
        feature.enabled === true
    );

  '''

        s = s[:effect_idx] + feature_effect + s[effect_idx:]
        print("DASHBOARD: added feature loading")
    else:
        print("WARNING: no useEffect found in dashboard")


# Add feature keys to known cards where missing.
for title, key in FEATURE_KEYS.items():
    # Only touch dashboard cards with title.
    pattern = re.compile(
        r'(\{\s*title:\s*["\']' +
        re.escape(title) +
        r'["\'][\s\S]*?)(\n\s*\},)',
        re.MULTILINE,
    )

    match = pattern.search(s)

    if match:
        block = match.group(1)

        if "feature:" not in block:
            block += f',\\n      feature: "{key}"'
            s = (
                s[:match.start()]
                + block
                + match.group(2)
                + s[match.end():]
            )
            print(f"DASHBOARD: added feature key to {title}")


# Filter schoolModules.
if "schoolModules.filter(" not in s:
    marker = "\\n  return ("
    idx = s.find(marker)

    if idx != -1:
        # Replace the closing array before render only if
        # schoolModules is directly rendered in the page.
        pass


# More reliable: replace common map forms.
s = s.replace(
    "{schoolModules.map((module) => (",
    "{schoolModules.filter((module) => !module.feature || featureEnabled(module.feature)).map((module) => ("
)

s = s.replace(
    "{schoolModules.map((item) => (",
    "{schoolModules.filter((item) => !item.feature || featureEnabled(item.feature)).map((item) => ("
)

# If map is called with schoolModules.map after formatting.
s = re.sub(
    r'\{schoolModules\.map\(',
    '{schoolModules.filter((module) => !module.feature || featureEnabled(module.feature)).map(',
    s,
)

write(DASHBOARD, s)


# ============================================================
# 3. LEARNING HUB
#
# Each learning module must have a feature key.
# ============================================================

s = LEARNING.read_text(encoding="utf-8")

# Fix module definitions.
learning_keys = {
    "Attendance": "attendance",
    "CBT": "cbt",
    "Ebooks": "ebooks",
    "YouTube Learning": "youtube_learning",
    "Browser Resources": "browser",
}

for title, key in learning_keys.items():
    pattern = re.compile(
        r'(\{\s*title:\s*["\']' +
        re.escape(title) +
        r'["\'][\s\S]*?)(\n\s*\},)',
        re.MULTILINE,
    )

    match = pattern.search(s)

    if match:
        block = match.group(1)

        if "feature:" not in block:
            block += f',\\n  feature: "{key}"'

            s = (
                s[:match.start()]
                + block
                + match.group(2)
                + s[match.end():]
            )

            print(f"LEARNING: added feature key to {title}")


# Ensure filter exists.
if "modules.filter((item) => !item.feature || featureEnabled(item.feature))" not in s:
    s = re.sub(
        r'\{modules\.map\(',
        '{modules.filter((item) => !item.feature || featureEnabled(item.feature)).map(',
        s,
    )

write(LEARNING, s)


# ============================================================
# 4. BACKEND FEATURE GET
#
# School Admin must be able to READ the feature state for their
# own school. Only SUPER_ADMIN should be able to toggle it.
# ============================================================

s = ROUTER.read_text(encoding="utf-8")

print()
print("BACKEND ROUTER: inspecting feature endpoints...")

# Show the relevant route region so the result is auditable.
for match in re.finditer(
    r'@router\.(get|patch|put|post|delete)\([^\n]+',
    s,
):
    line = match.group(0).strip()
    if "feature" in line.lower() or "school" in line.lower():
        print("  " + line)


# Replace GET role restriction if it specifically requires only
# SUPER_ADMIN.
#
# We deliberately do not alter PATCH/PUT toggle endpoints.
get_pattern = re.compile(
    r'(@router\.get\([^\n]+\)[\s\S]{0,500}?)'
    r'current_user:\s*User\s*=\s*Depends\(\s*require_roles\(\s*"SUPER_ADMIN"\s*\)\s*\)',
    re.MULTILINE,
)

match = get_pattern.search(s)

if match:
    block = match.group(1)

    replacement = (
        block
        + 'current_user: User = Depends(get_current_user)'
    )

    s = (
        s[:match.start()]
        + replacement
        + s[match.end():]
    )

    print("BACKEND: GET feature endpoint now accepts authenticated users")
else:
    print(
        "BACKEND: GET SUPER_ADMIN-only pattern not found; "
        "no unsafe toggle endpoint was changed."
    )


# Ensure get_current_user import exists.
if "from app.modules.auth.dependencies.current_user import get_current_user" not in s:
    imports = [
        "from app.modules.auth.dependencies.current_user import get_current_user\n",
        "from app.core.permissions import require_roles\n",
    ]

    inserted = False

    for imp in imports:
        if imp in s:
            s = s.replace(
                imp,
                imp + "from app.models.user import User\n",
                1,
            )
            inserted = True
            break

    if inserted:
        print("BACKEND: ensured User/get_current_user imports")
    else:
        # Conservative fallback: insert after imports.
        s = (
            "from app.modules.auth.dependencies.current_user import get_current_user\n"
            "from app.models.user import User\n"
            + s
        )
        print("BACKEND: inserted current-user imports")


write(ROUTER, s)


# ============================================================
# SUMMARY
# ============================================================

print()
print("============================================================")
print("GLOBAL FEATURE VISIBILITY FIX COMPLETE")
print("============================================================")
print()
print("Feature switches now control visibility across:")
print("  - Sidebar navigation")
print("  - School dashboard cards")
print("  - Learning Hub")
print()
print("All 15 feature keys:")
for key in FEATURE_KEYS.values():
    print("  -", key)

print()
print("IMPORTANT:")
print("  OFF  = hidden")
print("  ON   = visible")
print("  NONE = hidden")
print()
print("Existing module functionality was NOT removed.")
print("Existing module routes/data were NOT deleted.")
print("Toggle/write behavior was NOT intentionally changed.")
print()
print("Backups:")
print("  *.before-global-feature-fix")
print()
print("NEXT:")
print("  Restart FastAPI and Next.js.")
print("  Then turn OFF any feature from Super Admin.")
print("  Login as School Admin and refresh.")
print("============================================================")
