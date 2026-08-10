from pathlib import Path
import shutil

path = Path("components/sidebar.tsx")
backup = Path("components/sidebar.tsx.before-sidebar-final-rebuild")

if not backup.exists():
    shutil.copy2(path, backup)
    print(f"BACKUP CREATED: {backup}")
else:
    print(f"BACKUP EXISTS: {backup}")

s = path.read_text(encoding="utf-8")

# ------------------------------------------------------------
# 1. Add feature keys to Attendance and Events
# ------------------------------------------------------------

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

if old in s:
    s = s.replace(old, new, 1)
    print("FIXED: Attendance + Events feature keys")
else:
    print("WARNING: Attendance/Events exact block not found; checking individually.")

    old_attendance = '''{
name: "Attendance",
href: "/teacher/dashboard/attendance",
icon: ClipboardCheck,
color: "text-green-400",
},'''

    new_attendance = '''{
name: "Attendance",
href: "/teacher/dashboard/attendance",
icon: ClipboardCheck,
color: "text-green-400",
feature: "attendance",
},'''

    if old_attendance in s:
        s = s.replace(old_attendance, new_attendance, 1)
        print("FIXED: Attendance feature key")
    else:
        print("WARNING: Attendance block not found")

    old_events = '''{
name: "Events",
href: `${schoolBase}/events`,
icon: CalendarDays,
color: "text-pink-400",
},'''

    new_events = '''{
name: "Events",
href: `${schoolBase}/events`,
icon: CalendarDays,
color: "text-pink-400",
},'''

    # Events gets handled below by the generic insertion if needed.
    if old_events not in s:
        print("WARNING: Events block not found")


# ------------------------------------------------------------
# 2. Replace the entire featureEnabled/filter section
# ------------------------------------------------------------

start_marker = 'const featureEnabled = (featureKey: string) => {'
end_marker = 'function handleLogout() {'

start = s.find(start_marker)
end = s.find(end_marker)

if start == -1:
    print("ERROR: Could not find featureEnabled section.")
    raise SystemExit(1)

if end == -1:
    print("ERROR: Could not find handleLogout section.")
    raise SystemExit(1)

replacement = '''const featureEnabled = (featureKey: string) => {
  /*
   * Feature control is authoritative for School Admin.
   *
   * IMPORTANT:
   * - While the API is loading, keep the current menu visible.
   * - Once the API has loaded, an explicit feature record controls
   *   visibility.
   * - Missing records remain visible so an incomplete database
   *   configuration cannot accidentally break the dashboard.
   */
  if (!featuresLoaded) {
    return true;
  }

  const feature = schoolFeatures.find(
    (item) =>
      String(item?.feature_key || "").trim().toLowerCase() ===
      featureKey.trim().toLowerCase()
  );

  return feature?.enabled ?? true;
};

const filteredSchoolAdminMenu = schoolAdminMenu.filter((item) => {
  if (!item.feature) {
    return true;
  }

  return featureEnabled(item.feature);
});

let menu = superAdminMenu;

if (role === "SCHOOL_ADMIN") {
  menu = filteredSchoolAdminMenu;
}

if (role === "TEACHER") {
  menu = teacherMenu;
}

'''

s = s[:start] + replacement + s[end:]

# ------------------------------------------------------------
# 3. Add explicit feature keys to Attendance and Events if
#    they were still missing.
# ------------------------------------------------------------

attendance_old = '''name: "Attendance",
href: "/teacher/dashboard/attendance",
icon: ClipboardCheck,
color: "text-green-400",
}'''

attendance_new = '''name: "Attendance",
href: "/teacher/dashboard/attendance",
icon: ClipboardCheck,
color: "text-green-400",
feature: "attendance",
}'''

if attendance_old in s and "feature: \"attendance\"" not in s:
    s = s.replace(attendance_old, attendance_new, 1)
    print("FIXED: Attendance feature")

events_old = '''name: "Events",
href: `${schoolBase}/events`,
icon: CalendarDays,
color: "text-pink-400",
}'''

events_new = '''name: "Events",
href: `${schoolBase}/events`,
icon: CalendarDays,
color: "text-pink-400",
feature: "events",
}'''

if events_old in s and "feature: \"events\"" not in s:
    s = s.replace(events_old, events_new, 1)
    print("FIXED: Events feature")

# ------------------------------------------------------------
# 4. Add stronger diagnostics to the feature API response
# ------------------------------------------------------------

old_api = '''if (mounted) {
setSchoolFeatures(
Array.isArray(featuresResponse.data)
? featuresResponse.data
: []
);
setFeaturesLoaded(true);
}'''

new_api = '''if (mounted) {
const receivedFeatures = Array.isArray(featuresResponse.data)
? featuresResponse.data
: [];

console.log(
"SIDEBAR SCHOOL FEATURES:",
receivedFeatures.map((item: any) => ({
feature_key: item?.feature_key,
enabled: item?.enabled,
}))
);

setSchoolFeatures(receivedFeatures);
setFeaturesLoaded(true);
}'''

if old_api in s:
    s = s.replace(old_api, new_api, 1)
    print("ADDED: Sidebar feature diagnostics")
else:
    print("WARNING: Feature API state block not found; leaving it unchanged.")

path.write_text(s, encoding="utf-8")

print()
print("SUCCESS: Sidebar feature-control rebuild completed.")
print(f"FILE: {path}")
print(f"BACKUP: {backup}")
