# Data Source Matrix

Real institutional claims must carry an authoritative source and freshness/verification metadata. This matrix tracks what can be built before current-semester data arrives.

| Entity | Preferred source | Available without semester dataset? | Typical cadence | Ingestion |
|---|---|---:|---|---|
| Building/rooms | supplied maps + physical walkthrough + official confirmation | Yes, schematic only | rare | version-controlled map data + verification |
| Faculty public profiles | official IMS source | Potentially | occasional | reviewed source/import |
| Courses/descriptions | official IMS academic source | Potentially | curriculum changes | reviewed source/import |
| Research areas | official IMS research source | Potentially | occasional | reviewed source/import |
| Forms/resources | official IMS links | Potentially | occasional | reviewed link records |
| Academic calendar | official UPLB OUR calendar | Potentially | term/annual | reviewed date import |
| Sections | current-term official schedule/export | **No current real dataset** | semester | CSV/Sheet staging |
| Meeting rooms/times | current-term official schedule/export | **No current real dataset** | semester | CSV/Sheet staging |
| Faculty teaching assignments | current-term official schedule/export | **No current real dataset** | semester | CSV/Sheet staging |
| Consultation hours | faculty/IMS approved schedule | **No reliable real dataset yet** | semester | faculty/editor workflow or Sheet staging |
| Gradebook | student-entered | Yes | continuous | IndexedDB only |

## Source hierarchy

1. Explicit IMS/UPLB-managed entry or official export
2. Official IMS/UPLB webpage/document
3. Approved staff-maintained spreadsheet
4. Moderator-verified correction
5. User report as a lead only

A correction report is never automatically authoritative.

## Current development data

`supabase/seed.sql` contains visibly synthetic records only. These are development fixtures, not UPLB claims.
