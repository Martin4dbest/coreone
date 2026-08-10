from pathlib import Path
import shutil

path = Path("app/dashboard/schools/[schoolId]/learning/page.tsx")
backup = Path(str(path) + ".before-feature-syntax-fix")

if not backup.exists():
    shutil.copy2(path, backup)
    print(f"BACKUP: {backup}")

s = path.read_text(encoding="utf-8")

replacements = {
    '      icon:"📅"\n      feature: "attendance",':
    '      icon:"📅",\n      feature: "attendance",',

    '      icon:"📝"\n      feature: "cbt",':
    '      icon:"📝",\n      feature: "cbt",',

    '      icon:"📚"\n      feature: "ebooks",':
    '      icon:"📚",\n      feature: "ebooks",',

    '      icon:"▶️"\n      feature: "youtube_learning",':
    '      icon:"▶️",\n      feature: "youtube_learning",',

    '      icon:"🌐"\n    }':
    '      icon:"🌐",\n      feature: "browser",\n    }',
}

for old, new in replacements.items():
    if old not in s:
        print("ERROR: Expected text not found:")
        print(repr(old))
        raise SystemExit(1)
    s = s.replace(old, new, 1)

path.write_text(s, encoding="utf-8")

print("SUCCESS: Learning page feature syntax fixed.")
print("SUCCESS: Browser Resources now uses feature: browser.")
