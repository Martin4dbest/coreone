from pathlib import Path

path = Path("../admin-dashboard/app/dashboard/schools/[schoolId]/page.tsx")
s = path.read_text(encoding="utf-8")

print("=" * 70)
print("FEATURE STATE / YOUTUBE WORKSPACE INSPECTION")
print("=" * 70)

for i, line in enumerate(s.splitlines(), 1):
    if (
        "schoolFeatures" in line
        or "youtube_learning" in line
        or "school-features" in line
        or "YouTube Learning" in line
    ):
        start = max(1, i - 5)
        end = min(len(s.splitlines()), i + 8)

        print(f"\n--- lines {start}-{end} ---")
        for n in range(start, end + 1):
            print(f"{n}: {s.splitlines()[n-1]}")

print("=" * 70)
