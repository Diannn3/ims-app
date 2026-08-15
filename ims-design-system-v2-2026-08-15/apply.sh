#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 /path/to/ims-app [--force]" >&2
  exit 2
fi

REPO="$1"
FORCE="${2:-}"
BUNDLE_DIR="$(cd "$(dirname "$0")" && pwd)"
EXPECTED="$(tr -d '\r\n' < "$BUNDLE_DIR/BASE_SHA.txt")"

cd "$REPO"
if [[ ! -d .git ]]; then
  echo "Not a Git checkout: $REPO" >&2
  exit 2
fi

HEAD_SHA="$(git rev-parse HEAD)"
if [[ "$HEAD_SHA" != "$EXPECTED" && "$FORCE" != "--force" ]]; then
  echo "Repo HEAD is $HEAD_SHA, but this bundle was prepared against $EXPECTED." >&2
  echo "Review the divergence, then rerun with --force if intentional." >&2
  exit 3
fi

while IFS= read -r file; do
  [[ -z "$file" ]] && continue
  mkdir -p "$(dirname "$file")"
  cp -f "$BUNDLE_DIR/overlay/$file" "$file"
done < "$BUNDLE_DIR/FILES.txt"

echo
echo "Design System V2 overlay applied. Review before committing:"
git status --short
