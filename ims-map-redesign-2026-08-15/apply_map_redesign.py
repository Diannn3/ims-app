#!/usr/bin/env python3
from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
from pathlib import Path

BASE_SHA = "1fa2cbfd107abc20e3899b2501cfd80925c68ccb"
EXPECTED_BLOBS = {
    "src/lib/components/map/MapCanvas.svelte": "d9e8768d39effd61434b3ff9b997d3b4d9930279",
    "src/lib/components/map/MapViewport.svelte": "9007d130def5ec2b6f3baf282ae20c4bf0e67e5f",
}
NEW_FILES = {
    "src/lib/data/math-building/floor-visuals.ts",
    "docs/MAP_VISUAL_SYSTEM.md",
}
FILES = [
    "src/lib/data/math-building/floor-visuals.ts",
    "src/lib/components/map/MapCanvas.svelte",
    "src/lib/components/map/MapViewport.svelte",
    "docs/MAP_VISUAL_SYSTEM.md",
]


def git(repo: Path, *args: str) -> str:
    result = subprocess.run(
        ["git", *args], cwd=repo, text=True, capture_output=True, check=False
    )
    if result.returncode != 0:
        raise RuntimeError((result.stderr or result.stdout).strip())
    return result.stdout.strip()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("repo")
    parser.add_argument("--force", action="store_true")
    args = parser.parse_args()

    repo = Path(args.repo).expanduser().resolve()
    bundle = Path(__file__).resolve().parent
    overlay = bundle / "overlay"

    if not (repo / ".git").exists():
        raise SystemExit(f"Not a Git checkout: {repo}")

    head = git(repo, "rev-parse", "HEAD")
    if head != BASE_SHA and not args.force:
        raise SystemExit(
            f"Refusing to apply: checkout HEAD is {head}, expected {BASE_SHA}. "
            "Pull/check out the prepared base or review the divergence and use --force."
        )

    if not args.force:
        for rel, expected in EXPECTED_BLOBS.items():
            path = repo / rel
            if not path.exists():
                raise SystemExit(f"Expected source file is missing: {rel}")
            actual = git(repo, "hash-object", rel)
            if actual != expected:
                raise SystemExit(
                    f"Refusing to overwrite changed file {rel}: blob is {actual}, expected {expected}."
                )

        for rel in NEW_FILES:
            if (repo / rel).exists():
                raise SystemExit(
                    f"Refusing to overwrite new-path collision: {rel}. Review it or rerun with --force."
                )

    for rel in FILES:
        src = overlay / rel
        dst = repo / rel
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dst)
        print(f"applied {rel}")

    print("\nMap redesign applied. Review with:")
    print("  git diff --check")
    print("  git diff")
    print("  npm run verify")
    print("  npm run check")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except RuntimeError as exc:
        print(f"error: {exc}", file=sys.stderr)
        raise SystemExit(1)
