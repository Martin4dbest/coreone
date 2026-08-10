from pathlib import Path

path = Path("components/sidebar.tsx")
s = path.read_text(encoding="utf-8")

# Add Attendance feature key if missing.
attendance_marker = '''name: "Attendance",
href: "/teacher/dashboard/attendance",
icon: ClipboardCheck,
color: "text-green-400",'''

if 'feature: "attendance"' not in s:
    if attendance_marker not in s:
        print("ERROR: Could not find Attendance menu item.")
        raise SystemExit(1)

    s = s.replace(
        attendance_marker,
        attendance_marker + '\nfeature: "attendance",',
        1
    )
    print("ADDED: Attendance feature key")
else:
    print("OK: Attendance feature key already exists")

# Add Events feature key if missing.
events_marker = '''name: "Events",
href: `${schoolBase}/events`,
icon: CalendarDays,
color: "text-pink-400",'''

if 'feature: "events"' not in s:
    if events_marker not in s:
        print("ERROR: Could not find Events menu item.")
        raise SystemExit(1)

    s = s.replace(
        events_marker,
        events_marker + '\nfeature: "events",',
        1
    )
    print("ADDED: Events feature key")
else:
    print("OK: Events feature key already exists")

path.write_text(s, encoding="utf-8")

print("SUCCESS: Attendance and Events are now feature-controlled.")
