ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES public.users(id);
ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS form_id UUID;

CREATE INDEX IF NOT EXISTS idx_audit_form_created
  ON public.audit_logs(form_id, created_at DESC);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
