from pathlib import Path

path = Path("components/sidebar.tsx")
s = path.read_text(encoding="utf-8")

old = '''{
    name: "Attendance",
feature: "attendance",
    href: "/teacher/dashboard/attendance",
    icon: ClipboardCheck,
    color: "text-green-400",
  },'''

new = '''{
    name: "Attendance",
    href: "/teacher/dashboard/attendance",
    icon: ClipboardCheck,
    color: "text-green-400",
  },'''

if old not in s:
    print("WARNING: Exact Teacher Attendance block not found.")
    print("No changes made.")
else:
    s = s.replace(old, new, 1)
    path.write_text(s, encoding="utf-8")
    print("REMOVED: feature key from Teacher Attendance")
    print("SUCCESS")

