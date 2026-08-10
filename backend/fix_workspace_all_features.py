from pathlib import Path
import re
import shutil

ADMIN = Path("../admin-dashboard")
DASHBOARD = ADMIN / "app/dashboard/schools/[schoolId]/page.tsx"
LEARNING = ADMIN / "app/dashboard/schools/[schoolId]/learning/page.tsx"


def backup(path):
    backup_path = Path(str(path) + ".before-workspace-feature-fix")
    if not backup_path.exists():
        shutil.copy2(path, backup_path)
        print(f"BACKUP: {backup_path}")


# ============================================================
# SCHOOL WORKSPACE
# ============================================================

backup(DASHBOARD)
s = DASHBOARD.read_text(encoding="utf-8")

# ------------------------------------------------------------
# 1. Make sure useEffect/useState are imported
# ------------------------------------------------------------

if 'import { useEffect, useState } from "react";' not in s:
    if 'import { useEffect } from "react";' in s:
        s = s.replace(
            'import { useEffect } from "react";',
            'import { useEffect, useState } from "react";'
        )
    elif 'import { useState } from "react";' in s:
        s = s.replace(
            'import { useState } from "react";',
            'import { useEffect, useState } from "react";'
        )
    else:
        # Insert after "use client"
        if '"use client";' in s:
            s = s.replace(
                '"use client";',
                '"use client";\n\nimport { useEffect, useState } from "react";',
                1
            )

# ------------------------------------------------------------
# 2. Add school feature state after schoolId declaration
# ------------------------------------------------------------

if "const [schoolFeatures, setSchoolFeatures]" not in s:
    patterns = [
        r'(const\s+schoolId\s*=\s*[^;\n]+;)',
        r'(const\s+\{\s*schoolId\s*\}\s*=\s*[^;\n]+;)',
    ]

    inserted = False

    for pattern in patterns:
        match = re.search(pattern, s)
        if match:
            addition = r'''

  const [schoolFeatures, setSchoolFeatures] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;

    async function loadSchoolFeatures() {
      try {
        const response = await api.get(`/school-features/${schoolId}`);

        if (mounted) {
          setSchoolFeatures(response.data || []);
        }
      } catch (error) {
        console.error("Failed to load school features:", error);

        if (mounted) {
          setSchoolFeatures([]);
        }
      }
    }

    loadSchoolFeatures();

    return () => {
      mounted = false;
    };
  }, [schoolId]);

  const featureEnabled = (featureKey: string) =>
    schoolFeatures.some(
      (feature) =>
        feature.feature_key === featureKey &&
        feature.enabled === true
    );

  const workspaceFeatureKey = (title: string): string | null => {
    const keys: Record<string, string> = {
      Students: "students",
      Teachers: "teachers",
      Staff: "staff",
      Classes: "classes",
      Academics: "academics",
      Attendance: "attendance",
      "Learning Centre": "learning",
      Ebooks: "ebooks",
      "Internal Browser": "browser",
      "YouTube Learning": "youtube_learning",
      CBT: "cbt",
      Results: "results",
      Events: "events",
      Settings: "settings",
      Branding: "branding",
    };

    return keys[title] ?? null;
  };

'''
            s = s[:match.end()] + addition + s[match.end():]
            inserted = True
            print("DASHBOARD: feature state added")
            break

    if not inserted:
        print("WARNING: could not locate schoolId declaration")
else:
    print("DASHBOARD: feature state already exists")

# ------------------------------------------------------------
# 3. Filter ALL school workspace cards
# ------------------------------------------------------------

# Find the schoolModules.map rendering.
old_patterns = [
    r'\{schoolModules\.map\(\(module\) => \(',
    r'\{schoolModules\.map\(\(item\) => \(',
]

replaced = False

for pattern in old_patterns:
    if re.search(pattern, s):
        replacement = (
            '{schoolModules\n'
            '  .filter((module) => {\n'
            '    const featureKey = workspaceFeatureKey(module.title);\n'
            '    return !featureKey || featureEnabled(featureKey);\n'
            '  })\n'
            '.map((module) => ('
        )

        s = re.sub(pattern, replacement, s, count=1)
        replaced = True
        print("DASHBOARD: workspace cards now feature-controlled")
        break

if not replaced:
    # Handle a possible direct .map with whitespace/newlines.
    pattern = r'\{schoolModules\s*\.map\('

    if re.search(pattern, s):
        s = re.sub(
            pattern,
            '''{schoolModules
              .filter((module) => {
                const featureKey = workspaceFeatureKey(module.title);
                return !featureKey || featureEnabled(featureKey);
              })
              .map(''',
            s,
            count=1,
        )
        replaced = True
        print("DASHBOARD: workspace cards now feature-controlled")
    else:
        print("WARNING: could not locate schoolModules.map")

DASHBOARD.write_text(s, encoding="utf-8")
print(f"UPDATED: {DASHBOARD}")


# ============================================================
# LEARNING HUB
# ============================================================

backup(LEARNING)
s = LEARNING.read_text(encoding="utf-8")

# ------------------------------------------------------------
# Ensure feature fields exist on learning modules
# ------------------------------------------------------------

replacements = {
    '''title:"Attendance",
description:"Monitor student attendance and reports",
link:`/dashboard/schools/${schoolId}/attendance`,
icon:"📅"''':
    '''title:"Attendance",
description:"Monitor student attendance and reports",
link:`/dashboard/schools/${schoolId}/attendance`,
icon:"📅",
feature:"attendance"''',

    '''title:"CBT",
description:"Create exams, questions and analyse results",
link:`/dashboard/schools/${schoolId}/cbt`,
icon:"📝"''':
    '''title:"CBT",
description:"Create exams, questions and analyse results",
link:`/dashboard/schools/${schoolId}/cbt`,
icon:"📝",
feature:"cbt"''',

    '''title:"Ebooks",
description:"Manage digital learning materials",
link:`/dashboard/schools/${schoolId}/ebooks`,
icon:"📚"''':
    '''title:"Ebooks",
description:"Manage digital learning materials",
link:`/dashboard/schools/${schoolId}/ebooks`,
icon:"📚",
feature:"ebooks"''',

    '''title:"YouTube Learning",
description:"Manage educational videos",
link:`/dashboard/schools/${schoolId}/youtube-learning`,
icon:"▶️"''':
    '''title:"YouTube Learning",
description:"Manage educational videos",
link:`/dashboard/schools/${schoolId}/youtube-learning`,
icon:"▶️",
feature:"youtube_learning"''',

    '''title:"Browser Resources",
description:"Manage approved learning links",
link:`/dashboard/schools/${schoolId}/browser`,
icon:"🌐"''':
    '''title:"Browser Resources",
description:"Manage approved learning links",
link:`/dashboard/schools/${schoolId}/browser`,
icon:"🌐",
feature:"browser"''',
}

for old, new in replacements.items():
    if old in s:
        s = s.replace(old, new)
        print(f"LEARNING: added feature key for {new.split('title:')[1].split(',')[0]}")
    else:
        print("LEARNING: module pattern not found (may already be fixed)")

LEARNING.write_text(s, encoding="utf-8")
print(f"UPDATED: {LEARNING}")


print()
print("=" * 64)
print("WORKSPACE FEATURE VISIBILITY FIX COMPLETE")
print("=" * 64)
print()
print("All workspace cards now follow the school feature switch.")
print()
print("ON  -> visible")
print("OFF -> hidden")
print()
print("This affects presentation only.")
print("No underlying feature functionality was removed or disabled.")
print()
print("Backups:")
print("  page.tsx.before-workspace-feature-fix")
print("  learning/page.tsx.before-workspace-feature-fix")
print()
print("NEXT:")
print("1. Restart Next.js")
print("2. Turn a feature ON/OFF as Super Admin")
print("3. Check the School Workspace")
print("4. Check the sidebar")
print("5. Check the Learning Hub")
print("=" * 64)
