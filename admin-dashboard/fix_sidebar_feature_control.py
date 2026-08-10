from pathlib import Path
import shutil

path = Path("components/sidebar.tsx")
backup = Path("components/sidebar.tsx.before-feature-control-final")

if not backup.exists():
    shutil.copy2(path, backup)
    print(f"BACKUP CREATED: {backup}")

s = path.read_text(encoding="utf-8")

# ---------------------------------------------------------
# 1. Add feature state
# ---------------------------------------------------------

old = '''const [schoolName, setSchoolName] = useState("");
const [schoolLogo, setSchoolLogo] = useState("");'''

new = '''const [schoolName, setSchoolName] = useState("");
const [schoolLogo, setSchoolLogo] = useState("");
const [schoolFeatures, setSchoolFeatures] = useState<any[]>([]);
const [featuresLoaded, setFeaturesLoaded] = useState(false);'''

if old not in s:
    raise SystemExit("ERROR: Could not find sidebar state section.")

s = s.replace(old, new, 1)


# ---------------------------------------------------------
# 2. Load school features after school ID is known
# ---------------------------------------------------------

old = '''    setSchoolId(schoolIdString);

    const school = await getSchool(
      schoolIdString
    );'''

new = '''    setSchoolId(schoolIdString);

    // Load the same school feature state used by the
    // School Workspace and Learning Hub.
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
        // Fail open so a temporary feature API problem
        // does not make the sidebar disappear.
        setFeaturesLoaded(true);
      }
    }

    const school = await getSchool(
      schoolIdString
    );'''

if old not in s:
    raise SystemExit("ERROR: Could not find school loading section.")

s = s.replace(old, new, 1)


# ---------------------------------------------------------
# 3. Add feature keys to School Admin menu
# ---------------------------------------------------------

replacements = {
'''{
name: "Students",
href: "/teacher/dashboard/students",
icon: GraduationCap,
color: "text-purple-400",
},''':
'''{
name: "Students",
href: "/teacher/dashboard/students",
icon: GraduationCap,
color: "text-purple-400",
feature: "students",
},''',

'''{
name: "Teachers",
href: "/teacher/dashboard",
icon: Users,
color: "text-orange-400",
},''':
'''{
name: "Teachers",
href: "/teacher/dashboard",
icon: Users,
color: "text-orange-400",
feature: "teachers",
},''',

'''{
name: "Staff",
href: `${schoolBase}/staff`,
icon: UserRound,
color: "text-cyan-400",
},''':
'''{
name: "Staff",
href: `${schoolBase}/staff`,
icon: UserRound,
color: "text-cyan-400",
feature: "staff",
},''',

'''{
name: "Classes",
href: `${schoolBase}/classes`,
icon: Building2,
color: "text-indigo-400",
},''':
'''{
name: "Classes",
href: `${schoolBase}/classes`,
icon: Building2,
color: "text-indigo-400",
feature: "classes",
},''',

'''{
name: "Academics",
href: `${schoolBase}/academics`,
icon: BookOpen,
color: "text-rose-400",
},''':
'''{
name: "Academics",
href: `${schoolBase}/academics`,
icon: BookOpen,
color: "text-rose-400",
feature: "academics",
},''',

'''{
name: "Results",
href: `/dashboard/schools/${schoolId}/results`,
icon: FileText,
color: "text-yellow-400",
},''':
'''{
name: "Results",
href: `/dashboard/schools/${schoolId}/results`,
icon: FileText,
color: "text-yellow-400",
feature: "results",
},''',

'''{
name: "Attendance",
href: "/teacher/dashboard/attendance",
icon: ClipboardCheck,
color: "text-green-400",
},''':
'''{
name: "Attendance",
href: "/teacher/dashboard/attendance",
icon: ClipboardCheck,
color: "text-green-400",
feature: "attendance",
},''',

'''{
name: "Events",
href: `${schoolBase}/events`,
icon: CalendarDays,
color: "text-pink-400",
},''':
'''{
name: "Events",
href: `${schoolBase}/events`,
icon: CalendarDays,
color: "text-pink-400",
feature: "events",
},'''
}

for old, new in replacements.items():
    if old not in s:
        raise SystemExit(
            "ERROR: Could not find expected School Admin menu item:\n"
            + old
        )
    s = s.replace(old, new, 1)


# ---------------------------------------------------------
# 4. Add the actual featureEnabled logic
# ---------------------------------------------------------

old = '''let menu = superAdminMenu;

if (role === "SCHOOL_ADMIN") {
menu = schoolAdminMenu;
}

if (role === "TEACHER") {
menu = teacherMenu;
}'''

new = '''const featureEnabled = (featureKey: string) => {
  // Do not hide anything while the feature request is still loading.
  if (!featuresLoaded) {
    return true;
  }

  // If the API returned no usable feature list, fail open.
  if (!Array.isArray(schoolFeatures)) {
    return true;
  }

  const feature = schoolFeatures.find(
    (item) => item?.feature_key === featureKey
  );

  return feature ? feature.enabled === true : true;
};

let menu = superAdminMenu;

if (role === "SCHOOL_ADMIN") {
  menu = schoolAdminMenu.filter(
    (item) =>
      !("feature" in item) ||
      !item.feature ||
      featureEnabled(item.feature)
  );
}

if (role === "TEACHER") {
  menu = teacherMenu;
}'''

if old not in s:
    raise SystemExit("ERROR: Could not find menu selection section.")

s = s.replace(old, new, 1)


# ---------------------------------------------------------
# 5. Improve debug output
# ---------------------------------------------------------

old = '''console.log("FINAL MENU ROLE:", role, menu);'''

new = '''console.log("SIDEBAR FEATURE STATE:", {
  role,
  schoolId,
  featuresLoaded,
  schoolFeatures,
  visibleMenu: menu.map((item) => item.name),
});'''

if old in s:
    s = s.replace(old, new, 1)


path.write_text(s, encoding="utf-8")

print("SUCCESS: School Admin sidebar now uses school feature controls.")
print("SUCCESS: Existing routes and menu structure preserved.")
print("SUCCESS: Workspace and mobile files were not touched.")
