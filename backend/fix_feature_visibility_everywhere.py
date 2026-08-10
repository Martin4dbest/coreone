from pathlib import Path
import re
import shutil

ADMIN = Path("../admin-dashboard")

LAYOUT = ADMIN / "app/dashboard/schools/[schoolId]/layout.tsx"
WORKSPACE = ADMIN / "app/dashboard/schools/[schoolId]/page.tsx"
LEARNING = ADMIN / "app/dashboard/schools/[schoolId]/learning/page.tsx"


FEATURES = {
    "Students": "students",
    "Teachers": "teachers",
    "Staff": "staff",
    "Classes": "classes",
    "Academics": "academics",
    "Attendance": "attendance",
    "Learning Centre": "learning",
    "Learning": "learning",
    "Ebooks": "ebooks",
    "Internal Browser": "browser",
    "Browser Resources": "browser",
    "YouTube Learning": "youtube_learning",
    "CBT": "cbt",
    "Results": "results",
    "Events": "events",
    "Settings": "settings",
    "Branding": "branding",
}


def backup(path):
    backup = Path(str(path) + ".before-unified-feature-fix")
    if not backup.exists():
        shutil.copy2(path, backup)
        print(f"BACKUP: {backup}")


def write(path, text):
    path.write_text(text, encoding="utf-8")
    print(f"UPDATED: {path}")


def ensure_feature_helper(s):
    """
    Ensure the workspace/layout has one authoritative helper:

        featureEnabled("students")

    It reads schoolFeatures and requires enabled === true.
    """

    helper = '''
const featureEnabled = (featureKey: string) => {
  return schoolFeatures.some(
    (feature) =>
      feature.feature_key === featureKey &&
      feature.enabled === true
  );
};
'''

    # Remove existing featureEnabled declarations.
    s = re.sub(
        r'\nconst featureEnabled\s*=\s*\([^)]*\)\s*=>\s*\{.*?\n\};\s*',
        '\n',
        s,
        flags=re.DOTALL,
    )

    # Insert before schoolModules/modules if possible.
    for marker in [
        "const schoolModules = [",
        "const modules = [",
        "const schoolModules",
    ]:
        if marker in s:
            s = s.replace(marker, helper + "\n" + marker, 1)
            return s

    # Otherwise put it immediately before return.
    idx = s.find("\n  return (")
    if idx != -1:
        s = s[:idx] + "\n" + helper + s[idx:]

    return s


def add_feature_keys_to_objects(s):
    """
    Add feature: "..." to workspace card objects based on title.
    Does not alter hrefs or actual functionality.
    """

    for title, key in FEATURES.items():
        # Match an object beginning with the exact title.
        pattern = (
            r'(\{\s*'
            r'title:\s*["\']' + re.escape(title) + r'["\']'
            r'.*?)'
            r'(\n\s*\},)'
        )

        def repl(m):
            block = m.group(1)
            ending = m.group(2)

            if re.search(r'\bfeature\s*:', block):
                return m.group(0)

            return block + f'\n      feature: "{key}",' + ending

        s, count = re.subn(
            pattern,
            repl,
            s,
            count=1,
            flags=re.DOTALL,
        )

        if count:
            print(f"WORKSPACE: mapped {title} -> {key}")

    return s


def enforce_workspace_filter(s):
    """
    Replace any existing schoolModules filtering with a single
    feature-controlled filter.
    """

    # Remove previous broken workspaceFeatureKey filter blocks where possible.
    s = re.sub(
        r'\n\s*const\s+workspaceFeatureKey\s*=.*?\n\s*return\s+.*?\n\s*\}\s*\)\s*;',
        '',
        s,
        flags=re.DOTALL,
    )

    # Remove simple existing schoolModules.filter assignment.
    s = re.sub(
        r'const\s+visibleSchoolModules\s*=\s*schoolModules\.filter\(.*?\);',
        '',
        s,
        flags=re.DOTALL,
    )

    filter_code = '''
const visibleSchoolModules = schoolModules.filter(
  (module) =>
    typeof module.feature === "string" &&
    featureEnabled(module.feature)
);
'''

    if "const visibleSchoolModules" not in s:
        # Insert immediately after schoolModules array.
        match = re.search(
            r'\n\];\s*',
            s,
        )

        if match:
            # Use the first array close after schoolModules declaration.
            start = s.find("const schoolModules")
            if start != -1:
                end = s.find("\n];", start)
                if end != -1:
                    end += len("\n];")
                    s = s[:end] + "\n" + filter_code + s[end:]

    # Change common render references.
    s = s.replace(
        "{schoolModules.map(",
        "{visibleSchoolModules.map(",
    )

    s = s.replace(
        "schoolModules.map(",
        "visibleSchoolModules.map(",
    )

    return s


def fix_workspace():
    backup(WORKSPACE)
    s = WORKSPACE.read_text(encoding="utf-8")

    # ---------------------------------------------------------
    # Make sure this remains a client component.
    # ---------------------------------------------------------
    s = re.sub(
        r'^\s*"use client";\s*\n?',
        '',
        s,
        flags=re.MULTILINE,
    )

    s = '"use client";\n\n' + s.lstrip()

    # ---------------------------------------------------------
    # Ensure useParams exists.
    # ---------------------------------------------------------
    if 'from "next/navigation"' in s:
        if "useParams" not in s.split('from "next/navigation"', 1)[0]:
            s = s.replace(
                'from "next/navigation";',
                'from "next/navigation";',
                1,
            )

    if "import { useParams } from \"next/navigation\";" not in s:
        # Add it only if no next/navigation import exists.
        if 'from "next/navigation";' not in s:
            s = (
                'import { useParams } from "next/navigation";\n'
                + s
            )
        else:
            s = s.replace(
                'from "next/navigation";',
                'from "next/navigation";',
                1,
            )

    # ---------------------------------------------------------
    # Make sure useEffect/useState exist exactly once.
    # ---------------------------------------------------------
    imports = re.findall(
        r'import\s+\{[^}]*\}\s+from\s+["\']react["\'];',
        s,
        flags=re.DOTALL,
    )

    if imports:
        first = imports[0]

        if "useEffect" not in first:
            first = first.replace(
                "{",
                "{ useEffect,",
                1,
            )

        if "useState" not in first:
            first = first.replace(
                "{",
                "{ useState,",
                1,
            )

        # Remove all React imports and restore one.
        s = re.sub(
            r'import\s+\{[^}]*\}\s+from\s+["\']react["\'];\s*\n?',
            '',
            s,
            flags=re.DOTALL,
        )

        s = first + "\n" + s

    # ---------------------------------------------------------
    # Ensure schoolFeatures state exists.
    # ---------------------------------------------------------
    if "const [schoolFeatures" not in s:
        state_marker = "const [currentUser"
        if state_marker in s:
            s = s.replace(
                state_marker,
                'const [schoolFeatures, setSchoolFeatures] = useState<any[]>([]);\n  '
                + state_marker,
                1,
            )

    # ---------------------------------------------------------
    # Ensure feature loading exists.
    # ---------------------------------------------------------
    if "/school-features/${schoolId}" not in s:
        use_effect = '''
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

        # Put after component opening.
        component = re.search(
            r'export default function SchoolDetailsPage[^{]*\{',
            s,
        )

        if component:
            pos = component.end()
            s = s[:pos] + "\n" + use_effect + s[pos:]

    # ---------------------------------------------------------
    # Add feature fields to every workspace module.
    # ---------------------------------------------------------
    s = add_feature_keys_to_objects(s)

    # ---------------------------------------------------------
    # One authoritative feature helper.
    # ---------------------------------------------------------
    s = ensure_feature_helper(s)

    # ---------------------------------------------------------
    # Enforce workspace filtering.
    # ---------------------------------------------------------
    s = enforce_workspace_filter(s)

    write(WORKSPACE, s)


def fix_learning():
    backup(LEARNING)
    s = LEARNING.read_text(encoding="utf-8")

    # Make client component.
    s = re.sub(
        r'^\s*"use client";\s*\n?',
        '',
        s,
        flags=re.MULTILINE,
    )
    s = '"use client";\n\n' + s.lstrip()

    # Make sure feature state exists.
    if "const [features" not in s and "const [schoolFeatures" not in s:
        marker = "const schoolId"
        if marker in s:
            s = s.replace(
                marker,
                'const [schoolFeatures, setSchoolFeatures] = useState<any[]>([]);\n\n'
                + marker,
                1,
            )

    # Normalize to schoolFeatures.
    s = s.replace(
        "const [features, setFeatures] = useState<any[]>([]);",
        "const [schoolFeatures, setSchoolFeatures] = useState<any[]>([]);",
    )

    s = s.replace(
        "setFeatures(response.data || [])",
        "setSchoolFeatures(response.data || [])",
    )

    s = s.replace(
        "features.some(",
        "schoolFeatures.some(",
    )

    # Add feature keys to modules.
    s = add_feature_keys_to_objects(s)

    # Ensure every learning module has a feature.
    # Use the title-to-key mapping above.
    for title, key in FEATURES.items():
        pattern = (
            r'(\{\s*'
            r'title:\s*["\']' + re.escape(title) + r'["\']'
            r'.*?)'
            r'(\n\s*\},)'
        )

        def repl(m, key=key):
            block = m.group(1)
            ending = m.group(2)

            if re.search(r'\bfeature\s*:', block):
                return m.group(0)

            return block + f'\n      feature: "{key}",' + ending

        s = re.sub(
            pattern,
            repl,
            s,
            count=1,
            flags=re.DOTALL,
        )

    # Replace broken filter with strict feature filter.
    s = re.sub(
        r'\.filter\(\(item\)\s*=>.*?\)\.map',
        '.filter((item) => featureEnabled(item.feature)).map',
        s,
        flags=re.DOTALL,
    )

    write(LEARNING, s)


def validate():
    print()
    print("=" * 70)
    print("VALIDATION")
    print("=" * 70)

    for path in [WORKSPACE, LEARNING]:
        text = path.read_text(encoding="utf-8")

        print(f"\n{path}")

        if text.startswith('"use client";'):
            print("  OK: use client is first")
        else:
            print("  WARNING: use client is not first")

        if "workspaceFeatureKey" in text:
            print("  WARNING: workspaceFeatureKey still exists")
        else:
            print("  OK: no workspaceFeatureKey")

        if "featureEnabled" in text:
            print("  OK: featureEnabled exists")
        else:
            print("  WARNING: featureEnabled missing")

    print()
    print("=" * 70)
    print("FEATURE MAPPING")
    print("=" * 70)

    for name, key in FEATURES.items():
        print(f"  {name:<20} -> {key}")

    print()
    print("=" * 70)
    print("DONE")
    print("=" * 70)


fix_workspace()
fix_learning()
validate()

