from pathlib import Path
import re
import shutil

path = Path("../admin-dashboard/app/dashboard/schools/[schoolId]/page.tsx")

backup = Path(str(path) + ".before-workspace-feature-state-final")

if not backup.exists():
    shutil.copy2(path, backup)
    print(f"BACKUP: {backup}")

s = path.read_text(encoding="utf-8")

# ------------------------------------------------------------
# 1. Remove duplicate / conflicting feature state declarations
# ------------------------------------------------------------

s = re.sub(
    r'const \[schoolFeatures, setSchoolFeatures\] = useState<\s*SchoolFeature\[\]\s*>\(\[\]\);\s*',
    '',
    s,
    flags=re.S,
)

# ------------------------------------------------------------
# 2. Ensure there is ONE feature state
# ------------------------------------------------------------

if not re.search(r'const \[features, setFeatures\]', s):
    marker = 'const [school, setSchool] = useState<School | null>(null);'

    if marker in s:
        s = s.replace(
            marker,
            marker + '\n  const [features, setFeatures] = useState<any[]>([]);',
            1,
        )
    else:
        raise SystemExit(
            "ERROR: Could not find school state declaration."
        )

# ------------------------------------------------------------
# 3. Ensure feature loading exists
# ------------------------------------------------------------

if '/school-features/${schoolId}' not in s:
    # Insert feature loading inside the existing useEffect.
    marker = 'useEffect(() => {'

    pos = s.find(marker)

    if pos == -1:
        raise SystemExit(
            "ERROR: Could not find useEffect."
        )

    insert_at = pos + len(marker)

    feature_loader = r'''
    async function loadFeatures() {
      try {
        const response = await api.get(`/school-features/${schoolId}`);
        setFeatures(response.data || []);
      } catch (error) {
        console.error("Failed to load school features:", error);
        setFeatures([]);
      }
    }

    loadFeatures();

'''

    s = s[:insert_at] + feature_loader + s[insert_at:]

# ------------------------------------------------------------
# 4. Remove any remaining schoolFeatures references
# ------------------------------------------------------------

s = s.replace("schoolFeatures", "features")
s = s.replace("setSchoolFeatures", "setFeatures")

# ------------------------------------------------------------
# 5. Replace the workspace feature filtering logic with a safe
#    helper that ONLY shows enabled features.
# ------------------------------------------------------------

helper = r'''
  const featureEnabled = (featureKey: string) => {
    return features.some(
      (feature) =>
        feature.feature_key === featureKey &&
        feature.enabled === true
    );
  };

'''

# Remove duplicate featureEnabled helpers.
s = re.sub(
    r'\n\s*const featureEnabled = \(featureKey: string\) => \{.*?\n\s*\};\s*',
    '\n',
    s,
    flags=re.S,
)

s = re.sub(
    r'\n\s*const featureEnabled = \(featureKey: string\) =>.*?;\s*',
    '\n',
    s,
    flags=re.S,
)

# Insert helper immediately before schoolModules.
marker = 'const schoolModules = ['

if marker in s and 'const featureEnabled = (featureKey: string)' not in s:
    s = s.replace(
        marker,
        helper + marker,
        1,
    )

# ------------------------------------------------------------
# 6. Ensure YouTube Learning workspace card exists and is
#    controlled by the same feature state.
# ------------------------------------------------------------

youtube_pattern = re.compile(
    r'\n\s*\.\.\.\(features\.find\(\s*'
    r'\(feature\) => feature\.feature_key === "youtube_learning"\s*'
    r'\)\?\.enabled === true\s*'
    r'\? \[\{\s*'
    r'title: "YouTube Learning",\s*'
    r'description: "Educational video resources",\s*'
    r'icon: MonitorPlay,\s*'
    r'href: `/dashboard/schools/\$\{schoolId\}/youtube-learning`,\s*'
    r'\}\]\s*'
    r': \[\]\),',
    re.S,
)

youtube_block = r'''
    ...(featureEnabled("youtube_learning")
      ? [{
          title: "YouTube Learning",
          description: "Educational video resources",
          icon: MonitorPlay,
          href: `/dashboard/schools/${schoolId}/youtube-learning`,
        }]
      : []),
'''

if youtube_pattern.search(s):
    s = youtube_pattern.sub(youtube_block, s, count=1)
    print("YOUTUBE: normalized existing workspace card")
else:
    # If the card isn't present, insert it after Internal Browser.
    browser_marker = r'''    {
      title: "Internal Browser",
      description: "Approved educational websites",
      icon: Globe,
      href: `/dashboard/schools/${schoolId}/browser`,
    },'''

    if browser_marker in s:
        s = s.replace(
            browser_marker,
            browser_marker + '\n' + youtube_block,
            1,
        )
        print("YOUTUBE: added workspace card")
    else:
        print("WARNING: Internal Browser workspace card not found")

# ------------------------------------------------------------
# 7. Make sure MonitorPlay is imported.
# ------------------------------------------------------------

if "MonitorPlay" in s and not re.search(
    r'\bMonitorPlay\b',
    s,
):
    raise SystemExit("ERROR: MonitorPlay reference detected incorrectly.")

# If lucide import exists but MonitorPlay is absent, add it.
if "MonitorPlay" not in s:
    lucide_marker = 'from "lucide-react";'

    if lucide_marker in s:
        s = s.replace(
            lucide_marker,
            '  MonitorPlay,\n' + lucide_marker,
            1,
        )
    else:
        print("WARNING: lucide-react import not found")

# ------------------------------------------------------------
# 8. Fix accidental use(params) if this page is already using
#    useParams/useState/useEffect.
# ------------------------------------------------------------

s = s.replace(
    'const { schoolId } = use(params);',
    'const { schoolId } = useParams() as { schoolId: string };',
)

# Remove React "use" from import if present.
s = re.sub(
    r',\s*use(?=\s*})',
    '',
    s,
)

s = re.sub(
    r',\s*use\s*,',
    ',',
    s,
)

# ------------------------------------------------------------
# 9. Make sure useParams is imported.
# ------------------------------------------------------------

if 'useParams' not in s.split('\n', 20).__str__():
    pass

if 'useParams' in s and 'from "next/navigation"' in s:
    s = re.sub(
        r'import\s*\{\s*([^}]*)\}\s*from\s*"next/navigation";',
        lambda m: (
            'import { ' +
            (
                m.group(1).strip() +
                (', ' if m.group(1).strip() else '') +
                'useParams'
                if 'useParams' not in m.group(1)
                else m.group(1).strip()
            ) +
            ' } from "next/navigation";'
        ),
        s,
        count=1,
    )

# ------------------------------------------------------------
# 10. Validate basic structure before writing.
# ------------------------------------------------------------

if 'featureEnabled("youtube_learning")' not in s:
    raise SystemExit(
        "ERROR: YouTube feature-controlled workspace card was not created."
    )

if 'href: `/dashboard/schools/${schoolId}/youtube-learning`' not in s:
    raise SystemExit(
        "ERROR: YouTube workspace URL is missing."
    )

if 'const featureEnabled = (featureKey: string)' not in s:
    raise SystemExit(
        "ERROR: featureEnabled helper is missing."
    )

path.write_text(s, encoding="utf-8")

print()
print("=" * 70)
print("WORKSPACE FEATURE STATE FIX COMPLETE")
print("=" * 70)
print()
print("Workspace cards now use ONE feature state:")
print("  features")
print()
print("YouTube Learning:")
print('  feature key = "youtube_learning"')
print("  ON  -> visible")
print("  OFF -> hidden")
print()
print("URL:")
print("/dashboard/schools/${schoolId}/youtube-learning")
print()
print("Underlying YouTube functionality was NOT changed.")
print("Only workspace visibility was fixed.")
print()
print("BACKUP:")
print(backup)
print("=" * 70)
