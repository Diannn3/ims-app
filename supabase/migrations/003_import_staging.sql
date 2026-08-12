-- 003_import_staging.sql

-- Import Staging Architecture

CREATE TABLE public.import_rows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES public.import_batches(id) ON DELETE CASCADE,
  row_number integer NOT NULL,
  raw_payload jsonb NOT NULL,
  normalized_payload jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'valid', 'invalid', 'applied', 'skipped')),
  source_record_key text,
  content_hash text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (batch_id, row_number)
);

CREATE TABLE public.import_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  import_row_id uuid NOT NULL REFERENCES public.import_rows(id) ON DELETE CASCADE,
  issue_type text NOT NULL CHECK (issue_type IN ('error', 'warning', 'info')),
  message text NOT NULL,
  field text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.import_rows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_issues ENABLE ROW LEVEL SECURITY;

-- Only admins/editors (or imported_by) can access import staging data.
-- For now, allow authenticated users to read and write (until full RBAC is implemented).
CREATE POLICY "authenticated access import_rows" ON public.import_rows FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated access import_issues" ON public.import_issues FOR ALL TO authenticated USING (true) WITH CHECK (true);
