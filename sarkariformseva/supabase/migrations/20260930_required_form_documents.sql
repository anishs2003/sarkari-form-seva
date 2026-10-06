ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS required_documents TEXT NOT NULL DEFAULT '';

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS admin_message TEXT NOT NULL DEFAULT '';
