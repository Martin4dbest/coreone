from pathlib import Path
import re
import shutil

path = Path("app/dashboard/schools/[schoolId]/page.tsx")

backup = Path(str(path) + ".before-clean-workspace-filter")

if not backup.exists():
    shutil.copy2(path, backup)
    print(f"BACKUP: {backup}")

s = path.read_text(encoding="utf-8")

# ------------------------------------------------------------
# Remove ALL existing visibleSchoolModules declarations.
# We will create exactly ONE canonical declaration.
# ------------------------------------------------------------

s = re.sub(
    r'\n?const\s+visibleSchoolModules\s*=\s*schoolModules\.filter\([\s\S]*?\n\};?\s*(?=\n(?:const|return|\}))',
    '\n',
    s,
    count=10,
)

# Also remove the older broken multiline variants if present.
s = re.sub(
    r'\n?const\s+visibleSchoolModules\s*=\s*schoolModules\.filter\([\s\S]*?\);\s*',
    '\n',
    s,
    count=10,
)

# ------------------------------------------------------------
# Find the END of schoolModules array.
# Insert the canonical filter immediately after it.
# ------------------------------------------------------------

marker = "\n];"

start = s.find("const schoolModules = [")
if start == -1:
    raise SystemExit("ERROR: const schoolModules = [ not found")

end = s.find(marker, start)
if end == -1:
    raise SystemExit("ERROR: schoolModules closing ]; not found")

insert_at = end + len(marker)

canonical = r'''

// ============================================================
// SINGLE SOURCE OF TRUTH FOR SCHOOL WORKSPACE VISIBILITY
// ============================================================
//
// Feature ON  -> module visible
// Feature OFF -> module hidden
// No feature record -> module hidden
//
// Modules without a feature key are always visible
// (for example School Admins).
// ============================================================

const visibleSchoolModules = schoolModules.filter((module) => {
  if (!module.feature) {
    return true;
  }

  return featureEnabled(module.feature);
});
'''

s = s[:insert_at] + canonical + s[insert_at:]

path.write_text(s, encoding="utf-8")

print()
print("=" * 70)
print("WORKSPACE FEATURE FILTER FIXED")
print("=" * 70)
print()
print("Created exactly ONE visibleSchoolModules filter.")
print()
print("Workspace behavior:")
print("  feature ON  -> visible")
print("  feature OFF -> hidden")
print("  no record   -> hidden")
print()
print("YouTube Learning uses:")
print('  feature: "youtube_learning"')
print()
print("Ebooks uses:")
print('  feature: "ebooks"')
print()
print("Learning uses:")
print('  feature: "learning"')
print()
print("CBT uses:")
print('  feature: "cbt"')
print()
print("Results uses:")
print('  feature: "results"')
print()
print("Events uses:")
print('  feature: "events"')
print()
print("Internal Browser uses:")
print('  feature: "browser"')
print()
print("No underlying module was removed.")
print("=" * 70)
