-- Math Building Academic Hub — initial domain schema
-- Public institutional data is term/source aware. Personal gradebooks are intentionally local-first and absent here.

create extension if not exists pgcrypto;

create type public.app_role as enum ('student', 'faculty', 'content_editor', 'map_editor', 'admin');
create type public.verification_status as enum ('draft', 'needs_verification', 'verified', 'archived');
create type public.consultation_mode as enum ('in_person', 'online', 'hybrid', 'by_appointment');
create type public.report_status as enum ('open', 'reviewing', 'accepted', 'rejected', 'resolved');

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role public.app_role not null default 'student',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.data_sources (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  source_type text not null check (source_type in ('official_web','official_sheet','official_csv','faculty_entry','admin_entry','verified_report','other')),
  source_url text,
  authority text,
  notes text,
  created_at timestamptz not null default now()
);

create table public.buildings (
  id text primary key,
  name text not null,
  short_name text,
  verification_status public.verification_status not null default 'needs_verification',
  source_id uuid references public.data_sources(id),
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.floors (
  id text primary key,
  building_id text not null references public.buildings(id) on delete cascade,
  level integer not null,
  name text not null,
  display_order integer not null default 0,
  unique (building_id, level)
);

create table public.spaces (
  id text primary key,
  building_id text not null references public.buildings(id) on delete cascade,
  floor_id text not null references public.floors(id) on delete cascade,
  name text not null,
  kind text not null,
  subtitle text,
  is_public boolean not null default true,
  verification_status public.verification_status not null default 'needs_verification',
  source_id uuid references public.data_sources(id),
  last_verified_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.space_aliases (
  id bigint generated always as identity primary key,
  space_id text not null references public.spaces(id) on delete cascade,
  alias text not null,
  normalized_alias text not null,
  unique (space_id, normalized_alias)
);

create table public.location_anchors (
  id text primary key,
  building_id text not null references public.buildings(id) on delete cascade,
  floor_id text not null references public.floors(id) on delete cascade,
  space_id text references public.spaces(id) on delete set null,
  graph_node_id text not null,
  label text not null,
  qr_slug text not null unique,
  verification_status public.verification_status not null default 'needs_verification',
  last_verified_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.route_restrictions (
  id uuid primary key default gen_random_uuid(),
  building_id text not null references public.buildings(id) on delete cascade,
  edge_from text not null,
  edge_to text not null,
  reason text not null,
  starts_at timestamptz,
  ends_at timestamptz,
  active boolean not null default true,
  source_id uuid references public.data_sources(id),
  created_by uuid references public.profiles(user_id),
  created_at timestamptz not null default now()
);

create table public.academic_terms (
  id text primary key,
  academic_year text not null,
  term_name text not null,
  starts_on date,
  ends_on date,
  is_current boolean not null default false,
  source_id uuid references public.data_sources(id)
);

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  normalized_code text not null unique,
  title text,
  description text,
  units numeric(4,1),
  source_id uuid references public.data_sources(id),
  verification_status public.verification_status not null default 'draft',
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.course_aliases (
  id bigint generated always as identity primary key,
  course_id uuid not null references public.courses(id) on delete cascade,
  alias text not null,
  normalized_alias text not null,
  unique (course_id, normalized_alias)
);

create table public.course_prerequisites (
  course_id uuid not null references public.courses(id) on delete cascade,
  prerequisite_course_id uuid not null references public.courses(id) on delete cascade,
  relationship_type text not null default 'prerequisite',
  notes text,
  source_id uuid references public.data_sources(id),
  primary key (course_id, prerequisite_course_id, relationship_type),
  check (course_id <> prerequisite_course_id)
);

create table public.faculty (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references public.profiles(user_id) on delete set null,
  slug text not null unique,
  display_name text not null,
  title text,
  official_email text,
  bio text,
  photo_url text,
  official_profile_url text,
  publications_url text,
  source_id uuid references public.data_sources(id),
  verification_status public.verification_status not null default 'draft',
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.faculty_offices (
  id uuid primary key default gen_random_uuid(),
  faculty_id uuid not null references public.faculty(id) on delete cascade,
  term_id text references public.academic_terms(id) on delete cascade,
  space_id text not null references public.spaces(id) on delete restrict,
  is_primary boolean not null default true,
  source_id uuid references public.data_sources(id),
  verification_status public.verification_status not null default 'draft',
  unique (faculty_id, term_id, space_id)
);

create table public.sections (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  term_id text not null references public.academic_terms(id) on delete cascade,
  section_code text not null,
  source_id uuid references public.data_sources(id),
  verification_status public.verification_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (course_id, term_id, section_code)
);

create table public.section_meetings (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.sections(id) on delete cascade,
  weekday smallint not null check (weekday between 1 and 7),
  starts_at time not null,
  ends_at time not null,
  space_id text references public.spaces(id) on delete set null,
  notes text,
  source_id uuid references public.data_sources(id),
  verification_status public.verification_status not null default 'draft',
  check (ends_at > starts_at)
);

create table public.faculty_section_assignments (
  faculty_id uuid not null references public.faculty(id) on delete cascade,
  section_id uuid not null references public.sections(id) on delete cascade,
  assignment_role text not null default 'instructor',
  source_id uuid references public.data_sources(id),
  primary key (faculty_id, section_id, assignment_role)
);

create table public.consultation_hours (
  id uuid primary key default gen_random_uuid(),
  faculty_id uuid not null references public.faculty(id) on delete cascade,
  term_id text not null references public.academic_terms(id) on delete cascade,
  weekday smallint check (weekday between 1 and 7),
  starts_at time,
  ends_at time,
  mode public.consultation_mode not null,
  space_id text references public.spaces(id) on delete set null,
  appointment_url text,
  notes text,
  source_id uuid references public.data_sources(id),
  verification_status public.verification_status not null default 'draft',
  last_verified_at timestamptz,
  check ((starts_at is null and ends_at is null) or (starts_at is not null and ends_at is not null and ends_at > starts_at))
);

create table public.faculty_notices (
  id uuid primary key default gen_random_uuid(),
  faculty_id uuid not null references public.faculty(id) on delete cascade,
  title text not null,
  body text,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  created_by uuid references public.profiles(user_id),
  created_at timestamptz not null default now(),
  check (ends_at is null or ends_at > starts_at)
);

create table public.research_areas (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  source_id uuid references public.data_sources(id)
);

create table public.faculty_research_areas (
  faculty_id uuid not null references public.faculty(id) on delete cascade,
  research_area_id uuid not null references public.research_areas(id) on delete cascade,
  source_id uuid references public.data_sources(id),
  primary key (faculty_id, research_area_id)
);

create table public.academic_services (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  space_id text references public.spaces(id) on delete set null,
  official_url text,
  source_id uuid references public.data_sources(id),
  verification_status public.verification_status not null default 'draft',
  last_verified_at timestamptz
);

create table public.academic_resources (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  category text not null,
  description text,
  official_url text not null,
  source_id uuid references public.data_sources(id),
  verification_status public.verification_status not null default 'draft',
  last_checked_at timestamptz
);

create table public.academic_events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  space_id text references public.spaces(id) on delete set null,
  organizer text,
  official_url text,
  source_id uuid references public.data_sources(id),
  verification_status public.verification_status not null default 'draft',
  check (ends_at is null or ends_at > starts_at)
);

create table public.academic_dates (
  id uuid primary key default gen_random_uuid(),
  term_id text references public.academic_terms(id) on delete cascade,
  title text not null,
  category text,
  starts_on date not null,
  ends_on date,
  official_url text,
  source_id uuid references public.data_sources(id),
  verification_status public.verification_status not null default 'draft',
  check (ends_on is null or ends_on >= starts_on)
);

create table public.import_batches (
  id uuid primary key default gen_random_uuid(),
  term_id text references public.academic_terms(id) on delete set null,
  source_id uuid references public.data_sources(id),
  imported_by uuid references public.profiles(user_id),
  status text not null default 'staged' check (status in ('staged','validation_failed','ready','applied','rejected')),
  row_count integer not null default 0,
  valid_row_count integer not null default 0,
  error_count integer not null default 0,
  summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  applied_at timestamptz
);

create table public.correction_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_user_id uuid references public.profiles(user_id) on delete set null,
  report_type text not null,
  entity_type text not null,
  entity_id text,
  description text not null,
  status public.report_status not null default 'open',
  resolution_notes text,
  reviewed_by uuid references public.profiles(user_id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Useful indexes
create index section_meetings_space_idx on public.section_meetings(space_id, weekday, starts_at);
create index consultation_faculty_term_idx on public.consultation_hours(faculty_id, term_id, weekday);
create index faculty_offices_space_idx on public.faculty_offices(space_id);
create index academic_events_time_idx on public.academic_events(starts_at);
create index correction_reports_status_idx on public.correction_reports(status, created_at);

-- RLS baseline
alter table public.profiles enable row level security;
alter table public.data_sources enable row level security;
alter table public.buildings enable row level security;
alter table public.floors enable row level security;
alter table public.spaces enable row level security;
alter table public.space_aliases enable row level security;
alter table public.location_anchors enable row level security;
alter table public.route_restrictions enable row level security;
alter table public.academic_terms enable row level security;
alter table public.courses enable row level security;
alter table public.course_aliases enable row level security;
alter table public.course_prerequisites enable row level security;
alter table public.faculty enable row level security;
alter table public.faculty_offices enable row level security;
alter table public.sections enable row level security;
alter table public.section_meetings enable row level security;
alter table public.faculty_section_assignments enable row level security;
alter table public.consultation_hours enable row level security;
alter table public.faculty_notices enable row level security;
alter table public.research_areas enable row level security;
alter table public.faculty_research_areas enable row level security;
alter table public.academic_services enable row level security;
alter table public.academic_resources enable row level security;
alter table public.academic_events enable row level security;
alter table public.academic_dates enable row level security;
alter table public.import_batches enable row level security;
alter table public.correction_reports enable row level security;

-- Public read policies for verified/publishable institutional data.
create policy "public read buildings" on public.buildings for select using (verification_status <> 'archived');
create policy "public read floors" on public.floors for select using (true);
create policy "public read public spaces" on public.spaces for select using (is_public and verification_status <> 'archived');
create policy "public read aliases" on public.space_aliases for select using (true);
create policy "public read anchors" on public.location_anchors for select using (verification_status <> 'archived');
create policy "public read active restrictions" on public.route_restrictions for select using (active);
create policy "public read terms" on public.academic_terms for select using (true);
create policy "public read courses" on public.courses for select using (verification_status <> 'archived');
create policy "public read course aliases" on public.course_aliases for select using (true);
create policy "public read prerequisites" on public.course_prerequisites for select using (true);
create policy "public read faculty" on public.faculty for select using (verification_status <> 'archived');
create policy "public read faculty offices" on public.faculty_offices for select using (verification_status <> 'archived');
create policy "public read sections" on public.sections for select using (verification_status <> 'archived');
create policy "public read section meetings" on public.section_meetings for select using (verification_status <> 'archived');
create policy "public read assignments" on public.faculty_section_assignments for select using (true);
create policy "public read consultations" on public.consultation_hours for select using (verification_status <> 'archived');
create policy "public read active faculty notices" on public.faculty_notices for select using (ends_at is null or ends_at > now());
create policy "public read research areas" on public.research_areas for select using (true);
create policy "public read faculty research" on public.faculty_research_areas for select using (true);
create policy "public read services" on public.academic_services for select using (verification_status <> 'archived');
create policy "public read resources" on public.academic_resources for select using (verification_status <> 'archived');
create policy "public read events" on public.academic_events for select using (verification_status <> 'archived');
create policy "public read dates" on public.academic_dates for select using (verification_status <> 'archived');

-- Users can read and update their own profile.
create policy "users read own profile" on public.profiles for select using (auth.uid() = user_id);
create policy "users update own profile" on public.profiles for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Authenticated users may submit correction reports; they may read their own reports.
create policy "authenticated submit reports" on public.correction_reports for insert to authenticated with check (reporter_user_id is null or reporter_user_id = auth.uid());
create policy "users read own reports" on public.correction_reports for select to authenticated using (reporter_user_id = auth.uid());

-- Faculty can edit their own consultation records. Elevated admin/editor policies should be added in a dedicated migration after auth claims are finalized.
create policy "faculty insert own consultations" on public.consultation_hours for insert to authenticated
with check (exists (select 1 from public.faculty f where f.id = faculty_id and f.user_id = auth.uid()));
create policy "faculty update own consultations" on public.consultation_hours for update to authenticated
using (exists (select 1 from public.faculty f where f.id = faculty_id and f.user_id = auth.uid()))
with check (exists (select 1 from public.faculty f where f.id = faculty_id and f.user_id = auth.uid()));
create policy "faculty delete own consultations" on public.consultation_hours for delete to authenticated
using (exists (select 1 from public.faculty f where f.id = faculty_id and f.user_id = auth.uid()));
