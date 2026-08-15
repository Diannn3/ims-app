from __future__ import annotations

import argparse
import shutil
import subprocess
from pathlib import Path

EXPECTED_HEAD = "a628b6d5a20dfafe6901dce795aa488c729819af"
EXPECTED_BLOBS = {
    "src/lib/data/math-building/floor-visuals.ts": "f98512a9fec09f127576ca43dce414e1a5a9a852",
    "src/lib/components/map/MapCanvas.svelte": "4501e2376316c9373160f224f9d310e3ffe4d41c",
    "src/lib/components/map/MapViewport.svelte": "06d67107643f2da6374d30e29a490dde5f882f54",
    "src/routes/map/+page.svelte": "392d1427e4ffef59a0566465a6a10b3c2240091a",
    "docs/MAP_VISUAL_SYSTEM.md": "2a56157f0eba3a0c6aae292a36fbbc03dcba4b1e",
    "tests/e2e/accessibility-and-map.spec.ts": "40f56f3b209c68d6afdd89996837d47945d642e9",
}
FILES = [
    "src/lib/domain/navigation/map-camera.ts",
    "src/lib/domain/navigation/__tests__/map-camera.test.ts",
    "src/lib/data/math-building/floor-visuals.ts",
    "src/lib/components/map/MapCanvas.svelte",
    "src/lib/components/map/MapViewport.svelte",
    "src/routes/map/+page.svelte",
    "docs/MAP_VISUAL_SYSTEM.md",
    "tests/e2e/accessibility-and-map.spec.ts",
]


def git(repo: Path, *args: str) -> str:
    result = subprocess.run(
        ["git", *args],
        cwd=repo,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=True,
    )
    return result.stdout.strip()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("repo", type=Path)
    parser.add_argument("--force", action="store_true")
    args = parser.parse_args()

    repo = args.repo.resolve()
    if not (repo / ".git").exists():
        raise SystemExit(f"Not a Git checkout: {repo}")

    head = git(repo, "rev-parse", "HEAD")
    if head != EXPECTED_HEAD and not args.force:
        raise SystemExit(
            f"HEAD is {head}, expected {EXPECTED_HEAD}. "
            "Review the divergence or rerun with --force if intentional."
        )

    if not args.force:
        for rel, expected in EXPECTED_BLOBS.items():
            path = repo / rel
            if not path.exists():
                raise SystemExit(f"Expected source file is missing: {rel}")
            actual = git(repo, "hash-object", rel)
            if actual != expected:
                raise SystemExit(
                    f"Source file changed since this bundle was prepared: {rel}\n"
                    f"expected {expected}\nactual   {actual}"
                )

    bundle = Path(__file__).resolve().parent
    overlay = bundle / "overlay"
    for rel in FILES:
        source = overlay / rel
        destination = repo / rel
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, destination)

    print("IMS map navigation camera pass applied. Review before committing:")
    print(git(repo, "status", "--short"))


if __name__ == "__main__":
    main()
