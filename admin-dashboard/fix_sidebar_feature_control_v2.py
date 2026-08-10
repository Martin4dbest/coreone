from pathlib import Path
import shutil
import re

path = Path("components/sidebar.tsx")
backup = Path("components/sidebar.tsx.before-feature-control-v2")

if not backup.exists():
    shutil.copy2(path, backup)
    print(f"BACKUP CREATED: {backup}")

s = path.read_text(encoding="utf-8")


# ============================================================
# 1. Add feature state
# ============================================================

if "const [schoolFeatures" not in s:
    marker = 'const [schoolLogo, setSchoolLogo] = useState("");'

    if marker not in s:
        raise SystemExit("ERROR: Could not find schoolLogo state.")

    s = s.replace(
        marker,
        marker + '''
const [schoolFeatures, setSchoolFeatures] = useState<any[]>([]);
const [featuresLoaded, setFeaturesLoaded] = useState(false);''',
        1
    )

    print("ADDED: school feature state")
else:
    print("SKIP: school feature state already exists")


# ============================================================
# 2. Insert feature API request immediately after schoolId
# ============================================================

if "/school-features/" not in s:

    pattern = re.compile(
        r'(setSchoolId\(schoolIdString\);\s*)',
        re.MULTILINE
    )

    match = pattern.search(s)

    if not match:
        raise SystemExit(
            "ERROR: Could not find setSchoolId(schoolIdString)."
        )

    feature_loader = r'''
    // Load the school's feature-control state.
    try {
      const featuresResponse = await api.get(
        `/school-features/${schoolIdString}`
      );

      if (mounted) {
        setSchoolFeatures(
          Array.isArray(featuresResponse.data)
            ? featuresResponse.data
            : []
        );
        setFeaturesLoaded(true);
      }
    } catch (featureError) {
      console.error(
        "Unable to load school features for sidebar:",
        featureError
      );

      if (mounted) {
        // Fail open during a temporary API failure.
        setFeaturesLoaded(true);
      }
    }

'''

    s = (
        s[:match.end()]
        + "\n"
        + feature_loader
        + s[match.end():]
    )

    print("ADDED: school feature API loading")
else:
    print("SKIP: school feature API loading already exists")


# ============================================================
# 3. Add feature keys to School Admin items
# ============================================================

feature_items = {
    '"Students"': "students",
    '"Teachers"': "teachers",
    '"Staff"': "staff",
    '"Classes"': "classes",
    '"Academics"': "academics",
    '"Results"': "results",
    '"Attendance"': "attendance",
    '"Events"': "events",
}

for name, feature in feature_items.items():

    # Only operate inside schoolAdminMenu.
    start = s.find("const schoolAdminMenu = [")
    end = s.find("const teacherMenu = [", start)

    if start == -1 or end == -1:
        raise SystemExit(
            "ERROR: Could not locate schoolAdminMenu."
        )

    section = s[start:end]

    # Find the object beginning with name: "X"
    obj_pattern = re.compile(
        r'(\{\s*name:\s*' + re.escape(name) + r',.*?\n\},)',
        re.DOTALL
    )

    obj_match = obj_pattern.search(section)

    if not obj_match:
        print(f"WARNING: Could not find {name} menu item")
        continue

    obj = obj_match.group(1)

    if re.search(r'\bfeature\s*:', obj):
        print(f"SKIP: {feature} feature key already exists")
        continue

    # Insert feature immediately after color property.
    color_match = re.search(
        r'(color:\s*"[^"]+",)',
        obj
    )

    if not color_match:
        print(f"WARNING: No color property found for {name}")
        continue

    new_obj = (
        obj[:color_match.end()]
        + f'\nfeature: "{feature}",'
        + obj[color_match.end():]
    )

    section = (
        section[:obj_match.start()]
        + new_obj
        + section[obj_match.end():]
    )

    s = s[:start] + section + s[end:]

    print(f"ADDED: {name} -> {feature}")


# ============================================================
# 4. Add featureEnabled function
# ============================================================

if "const featureEnabled = (featureKey: string)" not in s:

    marker = "let menu = superAdminMenu;"

    if marker not in s:
        raise SystemExit(
            "ERROR: Could not find 'let menu = superAdminMenu;'."
        )

    feature_logic = '''
const featureEnabled = (featureKey: string) => {
  // Do not filter until the feature state has loaded.
  if (!featuresLoaded) {
    return true;
  }

  const feature = schoolFeatures.find(
    (item) => item?.feature_key === featureKey
  );

  // If a feature has no record, keep the existing menu item visible.
  // This prevents an incomplete feature configuration from hiding
  // existing School Admin functionality.
  return feature ? feature.enabled === true : true;
};

'''

    s = s.replace(
        marker,
        feature_logic + marker,
        1
    )

    print("ADDED: featureEnabled()")
else:
    print("SKIP: featureEnabled() already exists")


# ============================================================
# 5. Filter ONLY the School Admin menu
# ============================================================

old = '''if (role === "SCHOOL_ADMIN") {
menu = schoolAdminMenu;
}'''

new = '''if (role === "SCHOOL_ADMIN") {
  menu = schoolAdminMenu.filter(
    (item) =>
      !("feature" in item) ||
      !item.feature ||
      featureEnabled(item.feature)
  );
}'''

if old in s:
    s = s.replace(old, new, 1)
    print("UPDATED: School Admin menu feature filtering")
elif "menu = schoolAdminMenu.filter(" in s:
    print("SKIP: School Admin menu filtering already exists")
else:
    # Handle formatting variations safely.
    pattern = re.compile(
        r'if\s*\(\s*role\s*===\s*"SCHOOL_ADMIN"\s*\)\s*\{\s*'
        r'menu\s*=\s*schoolAdminMenu\s*;\s*\}',
        re.MULTILINE
    )

    match = pattern.search(s)

    if not match:
        raise SystemExit(
            "ERROR: Could not locate SCHOOL_ADMIN menu assignment."
        )

    s = s[:match.start()] + new + s[match.end():]
    print("UPDATED: School Admin menu feature filtering")


# ============================================================
# 6. Write
# ============================================================

path.write_text(s, encoding="utf-8")

print()
print("============================================================")
print("SUCCESS: Sidebar feature control installed.")
print("============================================================")
print("Workspace untouched.")
print("Backend untouched.")
print("Mobile app untouched.")
print("Existing routes untouched.")
