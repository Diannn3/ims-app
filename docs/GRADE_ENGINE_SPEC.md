# Grade Engine Specification

## Privacy model

Grade calculation is a private student utility. Default persistence should use IndexedDB on the device. Cloud sync, if introduced, must be explicit opt-in.

## Core entities

### GradeCategory
- name
- weight percentage
- mode
- assessments

### Assessment
- name
- earned points
- possible points
- pending if no valid earned/possible pair is entered

## Category calculation modes

### Points within category
Sum earned points / sum possible points across entered assessments.

### Equal assessment average
Convert each entered assessment to a percentage, then average the percentages equally.

## Course-level outputs

### Performance on graded work
Weighted score normalized by the sum of category weights that currently have entered graded work.

This avoids silently treating ungraded categories as zero.

### Weighted points earned so far
The sum of each graded category percentage × category weight. This is shown separately from performance on graded work.

## Target calculation

Given a user-entered final percentage target, current weighted points, and remaining ungraded course weight, calculate the average percentage required over the remaining weight.

The UI must detect:
- required average > 100%: target mathematically unreachable under the simplified setup
- required average <= 0%: current entered weighted points already cover the target, subject to the configured grading rules
- zero remaining weight: no target calculation available

## Planned extensions

- what-if state isolated from actual data
- user-entered transmutation table
- drop-lowest rules
- bonus points
- explicitly weighted individual assessments
- category-specific constraints

Do not hard-code a universal UP grading/transmutation scale.
