from pathlib import Path
import re
import shutil

ADMIN = Path("../admin-dashboard")

LAYOUT = ADMIN / "app/dashboard/schools/[schoolId]/layout.tsx"
DASHBOARD = ADMIN / "app/dashboard/schools/[schoolId]/page.tsx"
LEARNING = ADMIN / "app/dashboard/schools/[schoolId]/learning/page.tsx"

FEATURES = {
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
    backup = Path(str(path) + ".before-global-feature-fix-v2")

    if not backup.exists():
        shutil.copy2(path, backup)
        print(f"BACKUP: {backup}")


def save(path, text):
    path.write_text(text, encoding="utf-8")
    print(f"UPDATED: {path}")


def add_feature_to_object(text, title, key, field="title"):
    """
    Add feature: "key" to an object containing title/name.
    Does nothing if feature already exists in that object.
    """

    pattern = re.compile(
        rf'(\{{[^{{}}]*{field}\s*:\s*["\']{re.escape(title)}["\'][^{{}}]*?)(\n\s*\}})',
        re.MULTILINE,
    )

    match = pattern.search(text)

    if not match:
        return text, False

    block = match.group(1)

    if re.search(r'\bfeature\s*:', block):
        return text, False

    new_block = block.rstrip() + f',\n      feature: "{key}"'

    return (
        text[:match.start()]
        + new_block
        + match.group(2)
        + text[match.end():]
    ), True


# ============================================================
# BACKUPS
# ============================================================

for path in [LAYOUT, DASHBOARD, LEARNING]:
    backup(path)


# ============================================================
# 1. LAYOUT
# ============================================================

s = LAYOUT.read_text(encoding="utf-8")

# Replace the entire featureEnabled function safely.
pattern = re.compile(
    r'const featureEnabled\s*=\s*\(featureKey:\s*string\)\s*=>\s*\{[\s\S]*?\n\s*\};',
    re.MULTILINE,
)

replacement = '''const featureEnabled = (featureKey: string) => {
    return features.some(
      (feature) =>
        feature.feature_key === featureKey &&
        feature.enabled === true
    );
  };'''

if pattern.search(s):
    s = pattern.sub(replacement, s, count=1)
    print("LAYOUT: featureEnabled() replaced")
else:
    print("ERROR: featureEnabled() could not be found")
    raise SystemExit(1)


# Add feature keys to sidebar navigation.
for title, key in FEATURES.items():
    old = s

    s, changed = add_feature_to_object(
        s,
        title,
        key,
        field="name",
    )

    if changed:
        print(f"LAYOUT: added {key} -> {title}")


# Ensure navigation filtering exists.
filter_pattern = re.compile(
    r'const visibleNavigation\s*=\s*navigation\.filter\([\s\S]*?\);',
    re.MULTILINE,
)

filter_replacement = '''const visibleNavigation = navigation.filter(
    (item) =>
      (!item.superAdminOnly ||
        currentUser?.role?.name === "SUPER_ADMIN") &&
      (!item.feature || featureEnabled(item.feature))
  );'''

if filter_pattern.search(s):
    s = filter_pattern.sub(filter_replacement, s, count=1)
    print("LAYOUT: navigation feature filtering enforced")
else:
    print("WARNING: visibleNavigation block not found")


save(LAYOUT, s)


# ============================================================
# 2. SCHOOL DASHBOARD
# ============================================================

s = DASHBOARD.read_text(encoding="utf-8")

# Add state if missing.
if "const [schoolFeatures" not in s:
    state_pattern = re.compile(
        r'(const \[school,\s*setSchool\]\s*=\s*useState[^\n]*\n)',
        re.MULTILINE,
    )

    if state_pattern.search(s):
        s = state_pattern.sub(
            r'\1const [schoolFeatures, setSchoolFeatures] = useState<any[]>([]);\n',
            s,
            count=1,
        )
        print("DASHBOARD: schoolFeatures state added")
    else:
        print("WARNING: school state declaration not found")


# Add feature loader if missing.
if "/school-features/${schoolId}" not in s:

    loader = '''
  useEffect(() => {
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

    marker = "export default function"

    idx = s.find(marker)

    if idx != -1:
        # Insert after function opening, before existing content.
        brace = s.find("{", idx)

        if brace != -1:
            s = s[:brace + 1] + loader + s[brace + 1:]
            print("DASHBOARD: feature loader added")
    else:
        print("WARNING: dashboard component not found")


# Add feature field to every matching card.
for title, key in FEATURES.items():
    s, changed = add_feature_to_object(
        s,
        title,
        key,
        field="title",
    )

    if changed:
        print(f"DASHBOARD: added {key} -> {title}")


# Filter schoolModules.
if "schoolModules.filter(" not in s:
    s = s.replace(
        "{schoolModules.map(",
        "{schoolModules.filter((module) => !module.feature || featureEnabled(module.feature)).map("
    )

    print("DASHBOARD: schoolModules filtering enforced")


save(DASHBOARD, s)


# ============================================================
# 3. LEARNING HUB
# ============================================================

s = LEARNING.read_text(encoding="utf-8")

# Make sure feature state exists.
if "const [features" not in s:
    marker = "const schoolId = params.schoolId as string;"

    if marker in s:
        addition = '''

const [features, setFeatures] = useState<any[]>([]);

useEffect(() => {
  let mounted = true;

  async function loadFeatures() {
    try {
      const response = await api.get(
        `/school-features/${schoolId}`
      );

      if (mounted) {
        setFeatures(response.data || []);
      }
    } catch (error) {
      console.error(
        "Failed to load school features:",
        error
      );

      if (mounted) {
        setFeatures([]);
      }
    }
  }

  loadFeatures();

  return () => {
    mounted = false;
  };
}, [schoolId]);

const featureEnabled = (featureKey: string) =>
  features.some(
    (feature) =>
      feature.feature_key === featureKey &&
      feature.enabled === true
  );
'''

        s = s.replace(marker, marker + addition)
        print("LEARNING: feature state added")


# Add feature fields.
LEARNING_FEATURES = {
    "Attendance": "attendance",
    "CBT": "cbt",
    "Ebooks": "ebooks",
    "YouTube Learning": "youtube_learning",
    "Browser Resources": "browser",
}

for title, key in LEARNING_FEATURES.items():
    s, changed = add_feature_to_object(
        s,
        title,
        key,
        field="title",
    )

    if changed:
        print(f"LEARNING: added {key} -> {title}")


# Ensure filtering.
if "modules.filter(" not in s:
    s = s.replace(
        "{modules.map(",
        "{modules.filter((item) => !item.feature || featureEnabled(item.feature)).map("
    )

    print("LEARNING: module filtering enforced")


save(LEARNING, s)


# ============================================================
# FINISHED
# ============================================================

print()
print("============================================================")
print("GLOBAL FEATURE VISIBILITY FIX FINISHED")
print("============================================================")
print()
print("The feature switch now controls:")
print()
print("  Sidebar")
print("  School dashboard cards")
print("  Learning Hub")
print()
print("Rule:")
print("  enabled = true  -> visible")
print("  enabled = false -> hidden")
print("  no record       -> hidden")
print()
print("This does NOT delete or disable the underlying functionality.")
print("It only controls whether the feature is presented to the user.")
print()
print("Backups created with:")
print("  .before-global-feature-fix-v2")
print()
print("NEXT:")
print("Restart Next.js and FastAPI.")
print("============================================================")
