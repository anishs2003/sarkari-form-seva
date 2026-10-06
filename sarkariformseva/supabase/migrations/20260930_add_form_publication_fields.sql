CREATE TABLE IF NOT EXISTS public.forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  notification_id UUID REFERENCES public.notifications(id),
  active BOOLEAN DEFAULT TRUE,
  slug TEXT,
  title TEXT,
  organization TEXT,
  category TEXT,
  description TEXT,
  start_date DATE,
  last_date DATE,
  exam_date DATE,
  vacancy TEXT,
  qualification TEXT,
  eligibility TEXT,
  age_limit TEXT,
  application_fee TEXT,
  service_charge TEXT,
  notification_pdf_url TEXT,
  official_notification_url TEXT,
  official_website_url TEXT,
  apply_online_url TEXT,
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

ALTER TABLE public.forms ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE public.forms ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.forms ADD COLUMN IF NOT EXISTS organization TEXT;
ALTER TABLE public.forms ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.forms ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.forms ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE public.forms ADD COLUMN IF NOT EXISTS last_date DATE;
ALTER TABLE public.forms ADD COLUMN IF NOT EXISTS exam_date DATE;
ALTER TABLE public.forms ADD COLUMN IF NOT EXISTS vacancy TEXT;
ALTER TABLE public.forms ADD COLUMN IF NOT EXISTS qualification TEXT;
ALTER TABLE public.forms ADD COLUMN IF NOT EXISTS eligibility TEXT;
ALTER TABLE public.forms ADD COLUMN IF NOT EXISTS age_limit TEXT;
ALTER TABLE public.forms ADD COLUMN IF NOT EXISTS application_fee TEXT;
ALTER TABLE public.forms ADD COLUMN IF NOT EXISTS service_charge TEXT;
ALTER TABLE public.forms ADD COLUMN IF NOT EXISTS notification_pdf_url TEXT;
ALTER TABLE public.forms ADD COLUMN IF NOT EXISTS official_notification_url TEXT;
ALTER TABLE public.forms ADD COLUMN IF NOT EXISTS official_website_url TEXT;
ALTER TABLE public.forms ADD COLUMN IF NOT EXISTS apply_online_url TEXT;
ALTER TABLE public.forms ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.forms ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft';
ALTER TABLE public.forms ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.forms ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

UPDATE public.forms
SET title = name
WHERE title IS NULL;

UPDATE public.forms
SET slug = regexp_replace(lower(title), '[^a-z0-9]+', '-', 'g') || '-' || left(id::text, 8)
WHERE slug IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'forms_status_check'
      AND conrelid = 'public.forms'::regclass
  ) THEN
    ALTER TABLE public.forms
      ADD CONSTRAINT forms_status_check
      CHECK (status IN ('draft', 'pending-review', 'published', 'archived'));
  END IF;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_forms_slug ON public.forms(slug);
CREATE INDEX IF NOT EXISTS idx_forms_published_at
  ON public.forms(published_at DESC)
  WHERE status = 'published' AND active = TRUE;
CREATE INDEX IF NOT EXISTS idx_forms_status_category
  ON public.forms(status, category);
CREATE INDEX IF NOT EXISTS idx_forms_organization
  ON public.forms(organization);

CREATE OR REPLACE FUNCTION public.prepare_form_record()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.title = COALESCE(NULLIF(BTRIM(NEW.title), ''), NULLIF(BTRIM(NEW.name), ''));
  NEW.name = COALESCE(NULLIF(BTRIM(NEW.name), ''), NEW.title);
  IF NEW.slug IS NULL OR BTRIM(NEW.slug) = '' THEN
    NEW.slug = regexp_replace(lower(NEW.title), '[^a-z0-9]+', '-', 'g') || '-' || left(NEW.id::text, 8);
  END IF;
  IF NEW.status = 'published' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'published') THEN
    NEW.published_at = NOW();
  END IF;
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prepare_form_record ON public.forms;
CREATE TRIGGER prepare_form_record
  BEFORE INSERT OR UPDATE ON public.forms
  FOR EACH ROW
  EXECUTE FUNCTION public.prepare_form_record();

ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS public_read_published_forms ON public.forms;
CREATE POLICY public_read_published_forms
  ON public.forms FOR SELECT TO anon, authenticated
  USING (status = 'published' AND active = TRUE);

INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', FALSE)
ON CONFLICT (id) DO UPDATE SET public = FALSE;
