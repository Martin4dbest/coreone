from pathlib import Path

path = Path("app/dashboard/schools/[schoolId]/layout.tsx")

lines = path.read_text().splitlines()

new_lines = []
added = False

for line in lines:
    if line.strip() == "Palette," and not added:
        new_lines.extend([
            "},",
            "{",
            'name: "Branding",',
            'href: `${basePath}/branding`,',
            "icon: Palette,",
        ])
        added = True
    else:
        new_lines.append(line)

if added:
    path.write_text("\n".join(new_lines) + "\n")
    print("✅ Branding navigation fixed")
else:
    print("❌ Palette line not found")
