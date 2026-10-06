ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS keep_visible_after_last_date BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.forms
  ADD COLUMN IF NOT EXISTS keep_visible_after_last_date BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_notifications_last_date_published
  ON public.notifications(last_date)
  WHERE status = 'published';

CREATE INDEX IF NOT EXISTS idx_forms_last_date_published
  ON public.forms(last_date)
  WHERE status = 'published' AND active = TRUE;
