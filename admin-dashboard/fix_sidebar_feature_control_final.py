from pathlib import Path
import shutil

path = Path("components/sidebar.tsx")
backup = Path("components/sidebar.tsx.before-final-feature-control")

if not backup.exists():
    shutil.copy2(path, backup)
    print(f"BACKUP CREATED: {backup}")

s = path.read_text(encoding="utf-8")

# ---------------------------------------------------------
# 1. Add missing feature keys
# ---------------------------------------------------------

old = '''{
name: "Attendance",
href: "/teacher/dashboard/attendance",
icon: ClipboardCheck,
color: "text-green-400",
},
{
name: "Events",
href: `${schoolBase}/events`,
icon: CalendarDays,
color: "text-pink-400",
},'''

new = '''{
name: "Attendance",
href: "/teacher/dashboard/attendance",
icon: ClipboardCheck,
color: "text-green-400",
feature: "attendance",
},
{
name: "Events",
href: `${schoolBase}/events`,
icon: CalendarDays,
color: "text-pink-400",
feature: "events",
},'''

if old not in s:
    print("ERROR: Could not find Attendance/Events menu block.")
    raise SystemExit(1)

s = s.replace(old, new, 1)

# ---------------------------------------------------------
# 2. Replace featureEnabled with deterministic logic
# ---------------------------------------------------------

old_start = '''const featureEnabled = (featureKey: string) => {
'''

start = s.find(old_start)

if start == -1:
    print("ERROR: Could not find featureEnabled function.")
    raise SystemExit(1)

end_marker = '''};

let menu = superAdminMenu;'''

end = s.find(end_marker, start)

if end == -1:
    print("ERROR: Could not find end of featureEnabled function.")
    raise SystemExit(1)

new_function = '''const featureEnabled = (featureKey: string) => {
  // While the feature configuration is loading, keep the menu visible.
  // This prevents a temporary blank sidebar during the initial request.
  if (!featuresLoaded) {
    return true;
  }

  const feature = schoolFeatures.find(
    (item) => item?.feature_key === featureKey
  );

  // Once feature configuration has loaded, a feature must explicitly
  // exist and be enabled before it appears in the School Admin sidebar.
  return feature?.enabled === true;
};

'''

s = s[:start] + new_function + s[end + len("};\n\n"):]

# ---------------------------------------------------------
# 3. Keep Dashboard and Settings always visible.
#    All other School Admin items are feature controlled.
# ---------------------------------------------------------

old = '''if (role === "SCHOOL_ADMIN") {
menu = schoolAdminMenu.filter(
(item) =>
!("feature" in item) ||
!item.feature ||
featureEnabled(item.feature)
);
}'''

new = '''if (role === "SCHOOL_ADMIN") {
  menu = schoolAdminMenu.filter((item) => {
    // School Dashboard and Settings are always available.
    if (!item.feature) {
      return true;
    }

    return featureEnabled(item.feature);
  });
}'''

if old not in s:
    print("ERROR: Could not find School Admin menu filtering block.")
    raise SystemExit(1)

s = s.replace(old, new, 1)

# ---------------------------------------------------------
# 4. Save
# ---------------------------------------------------------

path.write_text(s, encoding="utf-8")

print("SUCCESS: Sidebar feature control finalized.")
print("SUCCESS: Attendance now uses feature 'attendance'.")
print("SUCCESS: Events now uses feature 'events'.")
print("SUCCESS: Missing feature records are now hidden after loading.")
print("SUCCESS: Dashboard and Settings remain always visible.")
