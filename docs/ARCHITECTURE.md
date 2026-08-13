# IMS Academic Hub Architecture

## Core principle

The app is one product with three deliberately separated domains. Shared **permanent IDs**, not UI components, connect them.

```text
                         SVELTEKIT
                            │
             ┌──────────────┴──────────────┐
             │                             │
        Public routes                 Staff routes
        +page.server.ts               form actions
             │                             │
             └──────────────┬──────────────┘
                            │
                    AcademicRepository
                            │
                 request-scoped Supabase
                            │
                    PostgreSQL + RLS
                            │
          ┌─────────────────┼──────────────────┐
          │                 │                  │
     Academic data     Import staging      Provenance
                                             │
                                   human review/publication

STATIC SPATIAL DOMAIN                 PERSONAL DOMAIN
─────────────────────                 ───────────────
spaces.json                           grade engine
semantic SVG                          IndexedDB
navigation graph                      what-if
A* routing                            target solver
QR anchors later                      custom grading scale
```

## Framework

SvelteKit owns routing, server loads, form actions, auth hooks, client interaction, and service-worker integration. Do not introduce Astro into the application runtime. A separate content-only marketing/docs site could be reconsidered later, but the application itself remains SvelteKit.

## Public academic read boundary

Pages do not reconstruct relational database graphs. They consume explicit DTO/read models from `src/lib/domain/academic/` composed in `src/lib/data-access/academic/*.server.ts`.

Presentation files must not contain raw `.from(...)` or `.rpc(...)` Supabase calls. `scripts/verify-project.mjs` checks this invariant.

## Spatial boundary

Academic records store permanent IDs such as `mb304`. They never contain SVG geometry.

```text
academic section meeting
        │
     space_id
        │
      mb304
       ├── static room metadata
       ├── floor geometry
       └── route graph entry
```

This makes a future renderer migration possible without rewriting academic data.

## Grade boundary

Gradebooks are personal tools, not institutional records. They are stored locally in versioned IndexedDB and do not enter Supabase, public search, imports, analytics, or academic snapshots.

## Trust model

Institutional records have two concepts:

- `review_status`: draft / needs_verification / verified
- `publication_status`: historical visibility lifecycle; public reads require `published`

A published record must be verified. Imports never auto-publish schedule changes.

## Auth model

Student/public use is accountless. Accounts are for staff workflows and optional future sync.

- student: default Auth profile role, no admin access
- faculty: future self-service scope only
- content_editor: stage/review imports and verify schedules
- map_editor: reserved for future verified map operations
- admin: publication, reference data, import apply/reject

The application checks role server-side and the database repeats enforcement through RLS/RPCs.

## Offline model

Deterministic spatial/static assets can be cached aggressively. Private/admin/auth data must never be cached by the service worker. Dynamic academic SSR is currently network-owned; an explicit public snapshot format is intentionally deferred rather than caching arbitrary SSR responses.
