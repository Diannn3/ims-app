-- 020_consultation_time_integrity.sql
--
-- Consultation windows may be fully flexible (no weekday/time), day-specific but
-- by arrangement (weekday without a fixed clock window), or scheduled
-- (weekday + start/end). The base schema already guarantees that start/end are
-- both NULL or both present with ends_at > starts_at. This migration closes the
-- remaining ambiguous state: a fixed clock window without a weekday.

alter table public.consultation_hours
  add constraint consultation_time_requires_weekday
  check (starts_at is null or weekday is not null);
