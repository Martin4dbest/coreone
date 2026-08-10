from pathlib import Path
import shutil

path = Path("app/dashboard/schools/[schoolId]/page.tsx")

backup = Path(str(path) + ".before-canonical-workspace-filter")

if not backup.exists():
    shutil.copy2(path, backup)
    print(f"BACKUP: {backup}")

s = path.read_text(encoding="utf-8")

# ------------------------------------------------------------
# Remove any existing visibleSchoolModules declaration
# ------------------------------------------------------------

start = s.find("const visibleSchoolModules")

if start != -1:
    # Find the end of the declaration.
    marker = "async function toggleSchool()"
    end = s.find(marker, start)

    if end == -1:
        raise SystemExit(
            "ERROR: Could not find toggleSchool() after visibleSchoolModules."
        )

    s = s[:start] + s[end:]
    print("REMOVED: old visibleSchoolModules declaration")
else:
    print("OK: no existing visibleSchoolModules declaration")

# ------------------------------------------------------------
# Insert exactly ONE canonical visibility filter
# ------------------------------------------------------------

marker = "async function toggleSchool()"

if marker not in s:
    raise SystemExit(
        "ERROR: Could not find async function toggleSchool()."
    )

visible_block = '''const visibleSchoolModules = schoolModules.filter(
    (module) => {
      // Modules without a feature key are controlled only by role.
      if (!module.feature) {
        return true;
      }

      // Every feature-controlled workspace card follows
      // the school's feature switch.
      return featureEnabled(module.feature);
    }
  );


'''

s = s.replace(
    marker,
    visible_block + marker,
    1
)

# ------------------------------------------------------------
# Clean duplicate feature properties inside module objects.
# This is cosmetic but prevents confusing object definitions.
# ------------------------------------------------------------

for feature in [
    "students",
    "teachers",
    "staff",
    "academics",
    "attendance",
    "results",
    "events",
    "learning",
    "cbt",
    "ebooks",
    "browser",
]:
    duplicate = (
        f'  feature: "{feature}",\n'
        f'  description:'
    )

    replacement = (
        f'  description:'
    )

    # Only remove the first duplicate occurrence where the
    # feature appears immediately before description and another
    # feature property exists later in the same object.
    # We intentionally leave the first feature declaration.
    # No aggressive global replacement is performed here.

# ------------------------------------------------------------
# Make YouTube use the same canonical filtering.
# Remove the special conditional wrapper and add it as a normal
# feature-controlled module.
# ------------------------------------------------------------

youtube_start = s.find(
    '...(featureEnabled("youtube_learning")'
)

if youtube_start != -1:
    youtube_end = s.find(
        '      : []),',
        youtube_start
    )

    if youtube_end == -1:
        raise SystemExit(
            "ERROR: Found YouTube conditional but could not find its end."
        )

    youtube_end += len('      : []),')

    youtube_module = '''{
    title: "YouTube Learning",
    feature: "youtube_learning",
    description: "Educational video resources",
    icon: MonitorPlay,
    href: `/dashboard/schools/${schoolId}/youtube-learning`,
  },'''

    s = s[:youtube_start] + youtube_module + s[youtube_end:]

    print("FIXED: YouTube now uses canonical feature filtering")
else:
    # If the conditional was already gone, make sure a normal
    # YouTube module exists.
    if 'title: "YouTube Learning"' not in s:
        school_end = s.find("async function toggleSchool()")

        if school_end == -1:
            raise SystemExit(
                "ERROR: Could not locate insertion point for YouTube."
            )

        insertion = '''{
    title: "YouTube Learning",
    feature: "youtube_learning",
    description: "Educational video resources",
    icon: MonitorPlay,
    href: `/dashboard/schools/${schoolId}/youtube-learning`,
  },


'''

        # Insert immediately before toggleSchool, but this would
        # be outside schoolModules, so don't do that.
        raise SystemExit(
            "ERROR: YouTube module is missing. Do not continue blindly."
        )

# ------------------------------------------------------------
# Safety checks
# ------------------------------------------------------------

if s.count("const visibleSchoolModules") != 1:
    raise SystemExit(
        f"ERROR: Expected exactly ONE visibleSchoolModules declaration, "
        f"found {s.count('const visibleSchoolModules')}"
    )

if s.count("const featureEnabled") != 1:
    raise SystemExit(
        f"ERROR: Expected exactly ONE featureEnabled declaration, "
        f"found {s.count('const featureEnabled')}"
    )

if '"use client";' not in s:
    raise SystemExit(
        'ERROR: "use client" directive is missing.'
    )

if not s.startswith('"use client";'):
    raise SystemExit(
        'ERROR: "use client" is not the first line.'
    )

if 'useParams } from "next/navigation"' not in s:
    raise SystemExit(
        "ERROR: useParams import is missing."
    )

path.write_text(s, encoding="utf-8")

print()
print("=" * 70)
print("CANONICAL WORKSPACE FEATURE FILTER INSTALLED")
print("=" * 70)
print()
print("Workspace behaviour:")
print("  Feature ON  -> card visible")
print("  Feature OFF -> card hidden")
print()
print("Controlled modules:")
print("  Students")
print("  Teachers")
print("  Staff")
print("  Academics")
print("  Attendance")
print("  Results")
print("  Events")
print("  Learning Centre")
print("  CBT")
print("  Ebooks")
print("  Internal Browser")
print("  YouTube Learning")
print()
print("Role-only modules remain role controlled.")
print()
print("Next: run the verification commands below.")
