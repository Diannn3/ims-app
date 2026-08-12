# Database Schema Overview

The Postgres schema is organized around three connected domains.

## Spatial domain

- `buildings`
- `floors`
- `spaces`
- `space_aliases`
- `location_anchors`
- `route_restrictions`

Structured SVG/graph assets may remain version-controlled application assets while database tables store identity, metadata, closures, and admin-managed content.

## Academic domain

- `academic_terms`
- `courses`
- `course_prerequisites`
- `sections`
- `section_meetings`
- `faculty`
- `faculty_offices`
- `faculty_section_assignments`
- `consultation_hours`
- `faculty_notices`
- `research_areas`
- `faculty_research_areas`
- `academic_services`
- `academic_resources`
- `academic_events`
- `academic_dates`

The key connection is `space_id`: meetings, faculty offices, services, and events can all point to the same physical space entity.

## Operations domain

- `import_batches`
- `data_sources`
- `correction_reports`
- `profiles` / role metadata

Every public institutional record should carry or inherit provenance and verification metadata where feasible.

## Personal student data

Gradebooks should remain IndexedDB-local by default and therefore are intentionally absent from the first public institutional schema. Optional cloud sync can be designed separately with stronger privacy controls.
