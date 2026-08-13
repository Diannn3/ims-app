# Included Skills

The following installed local skills are copied into this directory:

- `frontend-design` — intentional, subject-grounded UI direction and anti-template critique.
- `web-design-guidelines` — current interface/accessibility review; fetch its latest upstream rules before each audit.
- `test-driven-development` — mandatory red/green/refactor workflow for new behavior.
- `systematic-debugging` — evidence-first root-cause workflow for failures.
- `analyze-data-quality` — dataset grain, validity, integrity, freshness, and duplicate checks.

Plugin entrypoints under `../plugin-references/` are references only:

- `security-diff-scan` — use for a Git diff/PR/commit security review.
- `security-scan` — use for a standard repository/path security audit.

The Codex Security plugin must remain installed because its entrypoint skills depend on plugin references, scripts, scan storage, and tools not duplicated in this handoff pack.

Load only skills relevant to the current phase. `test-driven-development` is for implementation; `systematic-debugging` is triggered by failures; security scans are review gates, not everyday coding personas.

