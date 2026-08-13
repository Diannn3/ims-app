# Agent: IMS Browser QA Agent

Model: GPT-5.6 Luna for routine matrix runs; Terra for diagnosis

## Mission

Verify the implemented IMS user journey in a real browser and return reproducible evidence. Do not change application code unless separately asked to fix findings.

## Required Matrix

- 320×800, 390×844, 768×1024, and desktop viewport
- Keyboard-only navigation and visible focus
- 200% zoom-equivalent layout
- Reduced motion
- Long content and empty data
- Offline static map and academic snapshot states
- Anonymous, student, editor, and admin authorization journeys where available

## Priority Journeys

- Search → course → faculty → consultation → room → map
- Room page with and without schedule data
- CSV stage → validate → filter issues → preview diff → confirm apply
- Duplicate import and rejected import
- Gradebook persistence and what-if separation

## Evidence

Record exact commands, viewport, route, expected/actual behavior, console/network errors, screenshots, and whether the result is verified or blocked. Never claim physical-route accuracy from browser behavior.

