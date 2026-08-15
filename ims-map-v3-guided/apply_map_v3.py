from __future__ import annotations
import hashlib
import shutil
import subprocess
import sys
from pathlib import Path

EXPECTED_HEAD = "31bad598713c06373e8983e998eb5d5e91d4e026"
EXPECTED_BLOBS = {
    "docs/MAP_VISUAL_SYSTEM.md": "cce7790f279cd6a6db688e1ff95146b351bc459b",
    "src/lib/domain/navigation/map-camera.ts": "618d520d3dfed6c5e9e8e3d726be121784b7fbba",
    "src/lib/domain/navigation/__tests__/map-camera.test.ts": "53b8b0d80d45fa26e9ff55eb59d781d3bcfb962e",
    "src/lib/data/math-building/floor-visuals.ts": "c3116e993f09c1c574d51b7540bf62a9163eb0cd",
    "src/lib/components/map/MapCanvas.svelte": "4595062a36dbe78054ea0ecfb72b4459216fb569",
    "src/lib/components/map/MapViewport.svelte": "5adc0d6badace63103a468f0aaac3a8837fb78ab",
    "src/routes/map/+page.svelte": "93f14c28bbdbb34df7ca63929f4a38c523144ea5",
    "tests/e2e/accessibility-and-map.spec.ts": "f3b1ea7cd6aa42bf97bc6474c9e3aa8e9e7c11e4",
}
NEW_FILES = {
    "src/lib/domain/navigation/route-instructions.ts",
    "src/lib/domain/navigation/__tests__/route-instructions.test.ts",
}

def run(repo: Path, *args: str) -> str:
    return subprocess.check_output(["git", *args], cwd=repo, text=True).strip()

def git_blob(path: Path) -> str:
    return subprocess.check_output(["git", "hash-object", str(path)], text=True).strip()

def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("Usage: python apply_map_v3.py /path/to/ims-app")
    repo = Path(sys.argv[1]).resolve()
    bundle = Path(__file__).resolve().parent
    overlay = bundle / "overlay"
    if not (repo / ".git").exists():
        raise SystemExit(f"Not a Git checkout: {repo}")

    head = run(repo, "rev-parse", "HEAD")
    if head != EXPECTED_HEAD:
        raise SystemExit(f"Refusing stale apply: repo HEAD is {head}, expected {EXPECTED_HEAD}")

    dirty = run(repo, "status", "--porcelain")
    if dirty:
        raise SystemExit("Refusing to overwrite a dirty checkout. Commit/stash local changes first.")

    for rel, expected in EXPECTED_BLOBS.items():
        target = repo / rel
        if not target.exists():
            raise SystemExit(f"Missing expected source file: {rel}")
        actual = git_blob(target)
        if actual != expected:
            raise SystemExit(f"Refusing changed source file {rel}: {actual} != {expected}")

    for rel in NEW_FILES:
        if (repo / rel).exists():
            raise SystemExit(f"Refusing to replace unexpectedly existing new file: {rel}")

    files = [line.strip() for line in (bundle / "FILES.txt").read_text().splitlines() if line.strip()]
    for rel in files:
        source = overlay / rel
        destination = repo / rel
        if not source.exists():
            raise SystemExit(f"Bundle is incomplete: {rel}")
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, destination)

    print("IMS Map V3 overlay applied. Review before committing:")
    subprocess.run(["git", "status", "--short"], cwd=repo, check=False)

if __name__ == "__main__":
    main()
