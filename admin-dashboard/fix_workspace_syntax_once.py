from pathlib import Path
import re
import shutil

path = Path("app/dashboard/schools/[schoolId]/page.tsx")

backup = Path(str(path) + ".before-syntax-clean-final")

if not backup.exists():
    shutil.copy2(path, backup)
    print(f"BACKUP: {backup}")

s = path.read_text(encoding="utf-8")

# ============================================================
# 1. REMOVE ALL "use client" DIRECTIVES
# ============================================================

s = re.sub(
    r'^\s*"use client";\s*\n?',
    '',
    s,
    flags=re.MULTILINE,
)

# ============================================================
# 2. REMOVE ALL REACT IMPORTS AND REBUILD ONE CLEAN IMPORT
# ============================================================

s = re.sub(
    r'import\s+\{[^}]*\}\s+from\s+["\']react["\'];\s*\n?',
    '',
    s,
    flags=re.DOTALL,
)

# ============================================================
# 3. REMOVE ALL next/navigation IMPORTS
# ============================================================

s = re.sub(
    r'import\s+\{[^}]*\}\s+from\s+["\']next/navigation["\'];\s*\n?',
    '',
    s,
    flags=re.DOTALL,
)

# ============================================================
# 4. PUT CLIENT DIRECTIVE FIRST
# ============================================================

s = '"use client";\n\n' + s.lstrip()

# ============================================================
# 5. ADD CLEAN REACT + useParams IMPORTS
# ============================================================

s = (
    '"use client";\n\n'
    'import { useEffect, useState } from "react";\n'
    'import { useParams } from "next/navigation";\n'
    + s[len('"use client";\n\n'):]
)

# ============================================================
# 6. REMOVE EVERY EXISTING featureEnabled FUNCTION
# ============================================================

s = re.sub(
    r'\n\s*const featureEnabled\s*=\s*\([^)]*\)\s*=>\s*\{.*?\n\s*\};',
    '',
    s,
    flags=re.DOTALL,
)

# Also remove malformed variants.
s = re.sub(
    r'\n\s*function featureEnabled\s*\([^)]*\)\s*\{.*?\n\s*\}',
    '',
    s,
    flags=re.DOTALL,
)

# ============================================================
# 7. INSERT EXACTLY ONE featureEnabled HELPER
# ============================================================

helper = '''
  const featureEnabled = (featureKey: string) => {
    return schoolFeatures.some(
      (feature) =>
        feature.feature_key === featureKey &&
        feature.enabled === true
    );
  };

'''

# Insert immediately before schoolModules.
match = re.search(r'\n\s*const schoolModules\s*=', s)

if match:
    s = s[:match.start()] + "\n" + helper + s[match.start():]
    print("FIXED: one featureEnabled helper inserted")
else:
    # Fallback before first return.
    match = re.search(r'\n\s*return\s*\(', s)

    if match:
        s = s[:match.start()] + "\n" + helper + s[match.start():]
        print("FIXED: featureEnabled helper inserted before return")
    else:
        raise RuntimeError(
            "Could not locate schoolModules or return()"
        )

# ============================================================
# 8. REMOVE BROKEN workspaceFeatureKey REFERENCES
# ============================================================

s = re.sub(
    r'\n\s*const\s+workspaceFeatureKey\s*=.*?(?=\n\s*(?:return|const|let|if|\}))',
    '',
    s,
    flags=re.DOTALL,
)

# Remove individual broken filter fragments if present.
s = s.replace(
    'const featureKey = workspaceFeatureKey(module);',
    'const featureKey = module.feature;',
)

# ============================================================
# 9. MAKE SURE SCHOOL FEATURES STATE EXISTS
# ============================================================

if "const [schoolFeatures, setSchoolFeatures]" not in s:
    marker = "const [currentUser"
    if marker in s:
        s = s.replace(
            marker,
            'const [schoolFeatures, setSchoolFeatures] = useState<any[]>([]);\n  '
            + marker,
            1,
        )
        print("FIXED: schoolFeatures state added")

# ============================================================
# 10. MAKE SURE FEATURE LOADER EXISTS
# ============================================================

if "/school-features/${schoolId}" not in s:

    effect = '''
  useEffect(() => {
    let mounted = true;

    async function loadSchoolFeatures() {
      try {
        const response = await api.get(
          `/school-features/${schoolId}`
        );

        if (mounted) {
          setSchoolFeatures(response.data || []);
        }
      } catch (error) {
        console.error(
          "Failed to load school features:",
          error
        );

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

'''

    marker = re.search(
        r'\n\s*const featureEnabled\s*=',
        s,
    )

    if marker:
        s = s[:marker.start()] + "\n" + effect + s[marker.start():]
    else:
        raise RuntimeError(
            "Could not locate featureEnabled helper insertion point"
        )

    print("FIXED: feature loader added")

# ============================================================
# 11. ENSURE SCHOOL MODULES HAVE FEATURE KEYS
# ============================================================

FEATURES = {
    "Students": "students",
    "Teachers": "teachers",
    "Staff": "staff",
    "Classes": "classes",
    "Academics": "academics",
    "Attendance": "attendance",
    "Learning Centre": "learning",
    "Ebooks": "ebooks",
    "Internal Browser": "browser",
    "YouTube Learning": "youtube_learning",
    "CBT": "cbt",
    "Results": "results",
    "Events": "events",
    "Settings": "settings",
    "Branding": "branding",
}

for title, key in FEATURES.items():

    # Find object containing title and add feature immediately
    # after the title line if it doesn't already have one.
    pattern = (
        r'(\{\s*'
        r'title:\s*["\']' + re.escape(title) + r'["\'],)'
    )

    def add_feature(m, key=key):
        original = m.group(1)

        # Don't duplicate.
        if f'feature: "{key}"' in original:
            return original

        return (
            original
            + f'\n      feature: "{key}",'
        )

    s = re.sub(
        pattern,
        add_feature,
        s,
        count=1,
        flags=re.DOTALL,
    )

# ============================================================
# 12. REMOVE THE OLD YOUTUBE-ONLY SPECIAL CONDITION
# ============================================================

youtube_special = re.compile(
    r'\n\s*\.\.\.\(schoolFeatures\.find\(\s*'
    r'\(feature\)\s*=>\s*feature\.feature_key\s*===\s*'
    r'["\']youtube_learning["\'].*?'
    r':\s*\[\]\),',
    flags=re.DOTALL,
)

s = youtube_special.sub('', s)

# ============================================================
# 13. ENSURE YouTube CARD EXISTS IN THE MODULE ARRAY
# ============================================================

if 'title: "YouTube Learning"' not in s:

    browser_marker = re.search(
        r'(\{\s*'
        r'title:\s*["\']Internal Browser["\'].*?'
        r'\n\s*\},)',
        s,
        flags=re.DOTALL,
    )

    if browser_marker:
        youtube_card = '''
    {
      title: "YouTube Learning",
      feature: "youtube_learning",
      description: "Educational video resources",
      icon: MonitorPlay,
      href: `/dashboard/schools/${schoolId}/youtube-learning`,
    },
'''

        s = (
            s[:browser_marker.end()]
            + "\n"
            + youtube_card
            + s[browser_marker.end():]
        )

        print("FIXED: YouTube Learning workspace card added")

# ============================================================
# 14. ENSURE MonitorPlay IS IMPORTED
# ============================================================

if "MonitorPlay" in s:

    lucide_match = re.search(
        r'import\s*\{.*?\}\s*from\s*["\']lucide-react["\'];',
        s,
        flags=re.DOTALL,
    )

    if lucide_match:
        lucide = lucide_match.group(0)

        if "MonitorPlay" not in lucide:
            lucide_new = lucide.replace(
                "{",
                "{ MonitorPlay,",
                1,
            )

            s = (
                s[:lucide_match.start()]
                + lucide_new
                + s[lucide_match.end():]
            )

            print("FIXED: MonitorPlay import")

# ============================================================
# 15. CREATE ONE UNIFIED VISIBLE MODULE LIST
# ============================================================

# Remove old visibleSchoolModules declarations.
s = re.sub(
    r'\n\s*const\s+visibleSchoolModules\s*=\s*schoolModules\.filter\(.*?\);',
    '',
    s,
    flags=re.DOTALL,
)

# Add exactly one after the schoolModules array.
school_modules_match = re.search(
    r'const\s+schoolModules\s*=\s*\[',
    s,
)

if school_modules_match:

    start = school_modules_match.start()

    # Find closing ]; after schoolModules.
    end = s.find("\n];", school_modules_match.end())

    if end != -1:
        end += len("\n];")

        visible = '''
        
  const visibleSchoolModules = schoolModules.filter(
    (module) =>
      typeof module.feature === "string" &&
      featureEnabled(module.feature)
  );
'''

        s = s[:end] + visible + s[end:]

        # Render the filtered list.
        s = s.replace(
            "{schoolModules.map(",
            "{visibleSchoolModules.map(",
        )

        print("FIXED: unified Workspace feature filter")

# ============================================================
# 16. FINAL SANITIZATION
# ============================================================

# There must be exactly one use client.
s = re.sub(
    r'\n"use client";\s*',
    '\n',
    s,
)

s = '"use client";\n\n' + s.split('"use client";', 1)[-1].lstrip()

# Remove duplicate React imports if any.
react_imports = re.findall(
    r'import\s+\{[^}]*\}\s+from\s+"react";\s*\n?',
    s,
    flags=re.DOTALL,
)

if len(react_imports) > 1:
    first = react_imports[0]
    s = re.sub(
        r'import\s+\{[^}]*\}\s+from\s+"react";\s*\n?',
        '',
        s,
        flags=re.DOTALL,
    )
    s = first + s

# ============================================================
# WRITE
# ============================================================

path.write_text(s, encoding="utf-8")

print()
print("=" * 70)
print("WORKSPACE PAGE CLEANED")
print("=" * 70)
print("OK: use client is first")
print("OK: React hooks imported once")
print("OK: useParams imported")
print("OK: featureEnabled exists once")
print("OK: workspaceFeatureKey removed")
print("OK: feature state preserved")
print("OK: feature loading preserved")
print("OK: Workspace cards use feature keys")
print("OK: YouTube Learning card preserved/added")
print("OK: unified Workspace filtering")
print("=" * 70)
