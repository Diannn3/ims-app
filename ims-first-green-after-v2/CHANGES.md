# Change rationale

The last failing `master` Actions runs showed:

- all migrations 001–020 replayed successfully;
- database lint returned no schema errors;
- pgTAP failed only in `002_rbac_imports`, `003_assignment_provenance`, and `008_consultation_integrity`;
- seeded integration stopped before app checks because `seed-integration-auth.mjs` tried to update `profiles.role` through the hardened Data API.

The fixes in this bundle align test setup with the newer RLS / security-definer architecture. No production migration is changed.
