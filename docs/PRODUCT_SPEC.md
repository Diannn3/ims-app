# Product Specification

## Product definition

**Math Building Academic Hub** is a mobile-first web application that combines indoor building exploration, room navigation, course/faculty discovery, consultation information, academic resources, and private student tools.

It is not intended to replace SAIS, official grades, enrollment, or university records. Its job is to make public academic information discoverable and physically navigable.

## Product principles

1. **Search-first.** A student should be able to type a room, course, professor, facility, research area, or academic resource into one search surface.
2. **Map as an interface, not the database.** Room geometry and academic data are structured entities; the drawing is only one representation.
3. **Public without login.** Core navigation and academic discovery must work anonymously.
4. **Private tools stay private by default.** Gradebooks and personal preferences are local-first unless the student explicitly opts into sync.
5. **Source-aware.** Public academic data must carry provenance and verification timestamps.
6. **Semester-aware.** Sections, meetings, consultations, and academic dates are term-scoped rather than overwritten.
7. **No fake presence.** Class and consultation schedules must be described as scheduled information, not proof that a person or room is currently occupied.
8. **Accessibility is a primary interface.** Every visual route needs a textual equivalent.

## Core public modules

### Building Explorer
- Ground, second, and third-floor maps
- Search and highlight rooms
- Facility discovery: Math Clinic, Math Lab, toilets, stairs, entrances
- Room details
- Shareable room URLs

### Navigation
- Manual starting location
- QR `You Are Here` anchors
- Room-to-room route graph
- Cross-floor routing through verified stairs
- Route preview and per-floor route segments
- Landmark-oriented text instructions
- Temporary graph restrictions for closures

### Courses
- Course overview
- Prerequisites
- Current-term sections
- Meeting times and rooms
- Faculty assignment
- Links to consultation/help resources

### Faculty
- Name/title
- Official public profile link
- Office room and map navigation
- Current-term consultation schedule
- Current-term courses taught
- Research interests and clusters
- Optional appointment/booking URL

### Academic services and resources
- Math Clinic as both a physical space and academic service
- Academic forms/resources linking to authoritative official sources
- Academic calendar dates
- Institute events/seminars
- Research and thesis/SP discovery
- Structured `Who do I ask?` decision tree

## Private student tools

### Grade calculator
- Custom categories and percentages
- Raw score / total input
- Points-based or equal-assessment averaging within a category
- Performance on graded work
- Weighted points earned so far
- Pending work is not silently counted as zero
- What-if simulations (planned next)
- Required-average target tool
- User-entered grade transmutation table (planned)
- IndexedDB persistence (planned)

### Optional personalization
- Saved rooms/faculty/resources
- My courses
- Next-class shortcut
- Optional account/cloud sync later

## Explicitly out of scope for first release

- Live person tracking
- Claims about physical room occupancy based only on schedules
- Emergency evacuation routing without an authorized plan
- BLE/UWB indoor positioning
- AR navigation
- Native mobile apps
- AI chatbot as a dependency
- Official registration/grades/student records
