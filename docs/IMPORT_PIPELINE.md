# Academic Schedule Import Pipeline

## Goal

A schedule file must never write directly to public academic tables.

```text
CSV
 ↓
parse bytes safely
 ↓
header mapping
 ↓
canonical normalization
 ↓
reference resolution
 ↓
validation issues
 ↓
import_rows/import_issues
 ↓
diff + warning acknowledgement
 ↓
admin apply transaction
 ↓
needs_verification
 ↓
editor review
 ↓
admin publication
```

## Canonical V1 fields

Required:

- `course_code`
- `section_code`
- `days`
- `start_time`
- `end_time`

Optional:

- `room` (may be TBA when source permits)
- `faculty_email` (preferred faculty identity)
- `faculty_name`
- `source_record_key` / `record_id` (strongly recommended)

## Stable identity

When the official source provides a stable row/meeting identity, place it in `source_record_key`. The importer combines it with source + term so a correction updates the same source record even when room/faculty/end time changes.

If it is absent, the fallback identity uses normalized source, term, course, section, weekdays, and start time. This is intentionally less robust and is why a real source key is preferred.

## Validation behavior

### Blocking errors
- malformed/missing required header/identity
- invalid weekday/time range
- unknown/ambiguous room
- unknown course
- conflicting duplicate source key

### Warnings
- unknown/ambiguous faculty
- missing room/TBA where allowed
- changed row compared with prior source hash

Unknown faculty remains unresolved; no faculty profile is auto-created.

## Apply behavior

`apply_import_batch(...)` is admin-only and transactional. It locks the ready batch, checks preview hash and warning acknowledgements, upserts provenance, replaces only children owned by each exact source record, and commits once.

Changed/new schedule records become `needs_verification`; apply does **not** publish them.

## Review behavior

`set_schedule_section_review(...)` lets content editors/admins verify or return current-term schedules. `set_schedule_section_publication(...)` is admin-only. A schedule cannot be published unless its review status and meetings are verified and its course/referenced spaces are published.

Review/publication actions create `schedule_review_events` audit rows.

## Authoritative snapshots

The batch currently records `authoritative_snapshot`, but deletion/reconciliation for source rows missing from a new full snapshot is deliberately disabled. Deleting previously published schedules from omission alone is consequential and should be added only after the real source semantics are known and tested.
