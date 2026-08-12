# Security and Privacy Baseline

## Public data
Rooms, public course information, public faculty profiles, consultation schedules, official resources, and public events can be readable anonymously when sourced/approved for publication.

## Editing roles
- faculty: only their own editable profile fields, consultations, booking link, and notices
- content editor: approved academic content/imports
- map editor: spatial metadata and verified routing restrictions
- admin: role management and approvals

Frontend button visibility is not authorization. Database Row Level Security must enforce access.

## Sensitive/private student data
Personal gradebook contents are local-first. Do not send raw scores to analytics. Do not create individual movement histories for indoor navigation.

## Location privacy
QR anchors establish a start node for the current navigation session. They do not require storing a historical trail of where a user has been.

## Analytics
Prefer aggregate events such as:
- search_no_results
- route_failed
- room_search_count
- feature usage

Avoid linking routine map movement to named users unless a future feature has a clear user-facing need and explicit consent.
