-- 023_staff_import_read_grants.sql
-- The import/review tables are intentionally absent from the public-read grant
-- set. Their RLS policies already restrict rows to content editors/admins, but
-- PostgREST still needs an explicit column/table SELECT privilege before those
-- policies can be evaluated for the authenticated staff workspace.

grant select on table
  public.import_batches,
  public.import_rows,
  public.import_issues,
  public.source_records
to authenticated;
