#!/usr/bin/env python3
from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
from pathlib import Path

BASE_HEAD = "dedb2ca8dfa885ad1a0fcb6b09b1ab0c3cb09449"
EXPECTED_BLOBS = {
    "supabase/tests/database/002_rbac_imports.test.sql": "16414e7eaf4474e2c21ab24283c6feebf7f437b5",
    "supabase/tests/database/003_assignment_provenance.test.sql": "4a1def50f041c82e983b88c444216bb4ad5050aa",
    "supabase/tests/database/008_consultation_integrity.test.sql": "375d53b93673c20a45c89d6ccc81544c27f18852",
    "scripts/seed-integration-auth.mjs": "ed080839256cb97d44c23fc9eb3bccabb4641c03",
}


def repo_blob_hash(repo: Path, relative: str) -> str:
    result = subprocess.run(
        ["git", "hash-object", relative],
        cwd=repo,
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip() or f"git hash-object failed for {relative}")
    return result.stdout.strip()


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"Expected exactly one {label} replacement target, found {count}.")
    return text.replace(old, new, 1)


def patch_rbac_imports(text: str) -> str:
    text = replace_once(
        text,
        """select throws_ok(\n  $$select count(*) from public.data_sources$$,\n  '42501', null,\n  'student cannot inspect internal data sources'\n);""",
        """select results_eq(\n  $$select count(*)::bigint from public.data_sources$$,\n  array[0::bigint],\n  'student cannot inspect internal data sources'\n);""",
        "student data-source visibility assertion",
    )

    text = replace_once(
        text,
        """  'content editor can stage a validated import through the atomic RPC'\n);\nselect results_eq(""",
        """  'content editor can stage a validated import through the atomic RPC'\n);\nreset role;\nselect set_config(\n  'ims.test.editor_batch_id',\n  (select id::text from public.import_batches where filename = 'editor-rbac.csv'),\n  true\n);\nselect results_eq(""",
        "editor batch owner-side capture",
    )

    text = replace_once(
        text,
        """  'editor staged batch becomes ready only after atomic staging completes'\n);\nselect throws_ok(""",
        """  'editor staged batch becomes ready only after atomic staging completes'\n);\nset local role authenticated;\nset local request.jwt.claim.sub = '10000000-0000-0000-0000-000000000002';\nselect throws_ok(""",
        "editor role restoration",
    )

    text = replace_once(
        text,
        """values ((select id from public.import_batches where filename = 'editor-rbac.csv'), 99, '{}'::jsonb)""",
        """values (current_setting('ims.test.editor_batch_id')::uuid, 99, '{}'::jsonb)""",
        "editor direct-insert batch reference",
    )

    text = replace_once(
        text,
        """public.apply_import_batch((select id from public.import_batches where filename = 'editor-rbac.csv'), 'editor-preview-hash')""",
        """public.apply_import_batch(current_setting('ims.test.editor_batch_id')::uuid, 'editor-preview-hash')""",
        "editor apply batch reference",
    )

    text = replace_once(
        text,
        """  'admin can stage a validated import'\n);\nselect lives_ok(""",
        """  'admin can stage a validated import'\n);\nreset role;\nselect set_config(\n  'ims.test.admin_batch_id',\n  (select id::text from public.import_batches where filename = 'admin-rbac.csv'),\n  true\n);\nset local role authenticated;\nset local request.jwt.claim.sub = '10000000-0000-0000-0000-000000000003';\nselect lives_ok(""",
        "admin batch owner-side capture",
    )

    text = replace_once(
        text,
        """public.apply_import_batch((select id from public.import_batches where filename = 'admin-rbac.csv'), 'admin-preview-hash')""",
        """public.apply_import_batch(current_setting('ims.test.admin_batch_id')::uuid, 'admin-preview-hash')""",
        "admin apply batch reference",
    )

    return text


def patch_assignment_provenance(text: str) -> str:
    text = replace_once(
        text,
        """  'admin can stage two source rows that corroborate one instructor assignment'\n);\nselect lives_ok(""",
        """  'admin can stage two source rows that corroborate one instructor assignment'\n);\nreset role;\nselect set_config(\n  'ims.test.assignment_batch_1',\n  (select id::text from public.import_batches where filename = 'assignment-provenance-initial.csv'),\n  true\n);\nset local role authenticated;\nset local request.jwt.claim.sub = '10000000-0000-0000-0000-000000000013';\nselect lives_ok(""",
        "initial provenance batch owner-side capture",
    )

    text = replace_once(
        text,
        """(select id from public.import_batches where filename = 'assignment-provenance-initial.csv')""",
        """current_setting('ims.test.assignment_batch_1')::uuid""",
        "initial provenance apply batch reference",
    )

    text = replace_once(
        text,
        """  false\n);\nselect public.apply_import_batch(\n  (select id from public.import_batches where filename = 'assignment-provenance-b-null.csv'),\n  'assignment-provenance-preview-2'\n);""",
        """  false\n);\nreset role;\nselect set_config(\n  'ims.test.assignment_batch_2',\n  (select id::text from public.import_batches where filename = 'assignment-provenance-b-null.csv'),\n  true\n);\nset local role authenticated;\nset local request.jwt.claim.sub = '10000000-0000-0000-0000-000000000013';\nselect public.apply_import_batch(\n  current_setting('ims.test.assignment_batch_2')::uuid,\n  'assignment-provenance-preview-2'\n);""",
        "second provenance batch capture/apply",
    )

    text = replace_once(
        text,
        """  false\n);\nselect public.apply_import_batch(\n  (select id from public.import_batches where filename = 'assignment-provenance-a-null.csv'),\n  'assignment-provenance-preview-3'\n);""",
        """  false\n);\nreset role;\nselect set_config(\n  'ims.test.assignment_batch_3',\n  (select id::text from public.import_batches where filename = 'assignment-provenance-a-null.csv'),\n  true\n);\nset local role authenticated;\nset local request.jwt.claim.sub = '10000000-0000-0000-0000-000000000013';\nselect public.apply_import_batch(\n  current_setting('ims.test.assignment_batch_3')::uuid,\n  'assignment-provenance-preview-3'\n);""",
        "third provenance batch capture/apply",
    )

    return text


def validate_tap_plan(path: Path, expected_plan: int) -> None:
    text = path.read_text(encoding="utf-8")
    marker = f"select plan({expected_plan});"
    if marker not in text:
        raise RuntimeError(f"{path}: expected {marker}")


def main() -> int:
    parser = argparse.ArgumentParser(description="Apply IMS First-Green fixes on top of Design System V2.")
    parser.add_argument("repo", nargs="?", default=".", help="Path to ims-app checkout")
    parser.add_argument("--force", action="store_true", help="Skip exact base blob checks")
    args = parser.parse_args()

    repo = Path(args.repo).expanduser().resolve()
    if not (repo / ".git").exists():
        raise RuntimeError(f"Not a git checkout: {repo}")

    if not args.force:
        for relative, expected in EXPECTED_BLOBS.items():
            path = repo / relative
            if not path.exists():
                raise RuntimeError(f"Missing expected file: {relative}")
            actual = repo_blob_hash(repo, relative)
            if actual != expected:
                raise RuntimeError(
                    f"{relative} does not match the Design System V2 base.\n"
                    f"Expected blob {expected}, got {actual}.\n"
                    "Re-run on chatgpt/design-system-v2 at dedb2ca8... or inspect manually."
                )

    bundle = Path(__file__).resolve().parent

    rbac_path = repo / "supabase/tests/database/002_rbac_imports.test.sql"
    provenance_path = repo / "supabase/tests/database/003_assignment_provenance.test.sql"
    rbac_path.write_text(patch_rbac_imports(rbac_path.read_text(encoding="utf-8")), encoding="utf-8")
    provenance_path.write_text(
        patch_assignment_provenance(provenance_path.read_text(encoding="utf-8")), encoding="utf-8"
    )

    for relative in [
        "scripts/seed-integration-auth.mjs",
        "supabase/tests/database/008_consultation_integrity.test.sql",
    ]:
        source = bundle / "overlay" / relative
        target = repo / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, target)

    validate_tap_plan(rbac_path, 24)
    validate_tap_plan(provenance_path, 8)
    validate_tap_plan(repo / "supabase/tests/database/008_consultation_integrity.test.sql", 5)

    node_check = subprocess.run(
        ["node", "--check", "scripts/seed-integration-auth.mjs"],
        cwd=repo,
        capture_output=True,
        text=True,
        check=False,
    )
    if node_check.returncode != 0:
        raise RuntimeError(node_check.stderr.strip() or "node --check failed")

    print("Applied IMS First-Green fixes on top of Design System V2.")
    print(f"Expected source branch: chatgpt/design-system-v2 @ {BASE_HEAD}")
    print("Changed files:")
    for relative in EXPECTED_BLOBS:
        print(f"  - {relative}")
    print("\nNext: git diff --check && git diff, then open a PR or run the workflows manually.")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(f"ERROR: {error}", file=sys.stderr)
        raise SystemExit(1)
