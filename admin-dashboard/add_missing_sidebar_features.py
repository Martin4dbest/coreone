from pathlib import Path

path = Path("components/sidebar.tsx")
lines = path.read_text(encoding="utf-8").splitlines()

result = []
added = set()

for line in lines:
    result.append(line)

    stripped = line.strip()

    if stripped == 'name: "Attendance",':
        # Avoid duplicate insertion
        if not any(
            x.strip() == 'feature: "attendance",'
            for x in lines[lines.index(line)+1:lines.index(line)+3]
        ):
            result.append('feature: "attendance",')
            added.add("attendance")

    elif stripped == 'name: "Events",':
        if not any(
            x.strip() == 'feature: "events",'
            for x in lines[lines.index(line)+1:lines.index(line)+3]
        ):
            result.append('feature: "events",')
            added.add("events")

path.write_text("\n".join(result) + "\n", encoding="utf-8")

for feature in ("attendance", "events"):
    if feature in added:
        print(f"ADDED: {feature}")
    else:
        print(f"NOT ADDED: {feature}")

print("DONE")
