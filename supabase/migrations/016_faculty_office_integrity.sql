-- 016_faculty_office_integrity.sql
-- A NULL term_id represents a non-term-specific/permanent office assignment. Ordinary
-- PostgreSQL UNIQUE constraints treat NULLs as distinct, so the original
-- (faculty_id, term_id, space_id) constraint could admit duplicate permanent offices.
-- Enforce identity with NULLS NOT DISTINCT and allow at most one primary office for a
-- faculty member within the same term (including the permanent/null term scope).

do $$
declare
  v_constraint name;
begin
  select c.conname into v_constraint
  from pg_constraint c
  where c.conrelid = 'public.faculty_offices'::regclass
    and c.contype = 'u'
    and pg_get_constraintdef(c.oid) like 'UNIQUE (faculty_id, term_id, space_id)%'
  limit 1;

  if v_constraint is not null then
    execute format('alter table public.faculty_offices drop constraint %I', v_constraint);
  end if;
end
$$;

drop index if exists public.faculty_offices_identity_uidx;
create unique index faculty_offices_identity_uidx
  on public.faculty_offices(faculty_id, term_id, space_id)
  nulls not distinct;

drop index if exists public.faculty_offices_one_primary_uidx;
create unique index faculty_offices_one_primary_uidx
  on public.faculty_offices(faculty_id, term_id)
  nulls not distinct
  where is_primary = true;
