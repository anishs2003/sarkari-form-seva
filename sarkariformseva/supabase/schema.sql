CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'student',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT,
  mobile TEXT,
  email TEXT,
  otp_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'admin',
  mfa_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT,
  title TEXT NOT NULL,
  organization TEXT,
  category TEXT,
  short_description TEXT,
  description TEXT,
  start_date DATE,
  qualification TEXT,
  last_date DATE,
  exam_date DATE,
  vacancy TEXT,
  eligibility TEXT,
  age_limit TEXT,
  application_fee TEXT,
  service_charge TEXT,
  notification_pdf_url TEXT,
  official_notification_url TEXT,
  official_pdf_url TEXT,
  apply_online_url TEXT,
  official_website_url TEXT,
  featured BOOLEAN DEFAULT FALSE,
  keep_visible_after_last_date BOOLEAN NOT NULL DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  publish_date TIMESTAMPTZ,
  status TEXT DEFAULT 'draft',
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS short_description TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS qualification TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS service_charge TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS notification_pdf_url TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS official_notification_url TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS keep_visible_after_last_date BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE notifications
SET published_at = COALESCE(publish_date, updated_at, created_at, NOW())
WHERE status = 'published' AND published_at IS NULL;

UPDATE notifications
SET slug = regexp_replace(lower(title), '[^a-z0-9]+', '-', 'g') || '-' || left(id::text, 8)
WHERE slug IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_slug ON notifications(slug);
CREATE INDEX IF NOT EXISTS idx_notifications_published_at ON notifications(published_at DESC) WHERE status = 'published';

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DO $$
DECLARE
  existing_policy RECORD;
BEGIN
  FOR existing_policy IN
    SELECT tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename IN ('forms', 'notifications')
  LOOP
    EXECUTE format('DROP POLICY %I ON public.%I', existing_policy.policyname, existing_policy.tablename);
  END LOOP;
END
$$;

CREATE POLICY public_read_published_notifications
  ON notifications FOR SELECT TO anon, authenticated
  USING (status = 'published');

CREATE TABLE IF NOT EXISTS notification_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_name TEXT NOT NULL,
  website TEXT,
  category TEXT,
  source_type TEXT,
  rss_url TEXT,
  api_endpoint TEXT,
  public_url TEXT,
  enabled BOOLEAN DEFAULT TRUE,
  last_checked TIMESTAMPTZ,
  status TEXT DEFAULT 'active',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notification_fetch_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES notification_sources(id),
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT,
  summary TEXT,
  error_message TEXT
);

CREATE TABLE IF NOT EXISTS notification_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID REFERENCES notifications(id),
  reviewed_by UUID REFERENCES admins(id),
  action TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  notification_id UUID REFERENCES notifications(id),
  active BOOLEAN NOT NULL DEFAULT FALSE,
  slug TEXT,
  title TEXT,
  organization TEXT,
  category TEXT,
  short_description TEXT NOT NULL DEFAULT '',
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
  required_documents TEXT NOT NULL DEFAULT '',
  notification_pdf_url TEXT,
  official_notification_url TEXT,
  official_website_url TEXT,
  apply_online_url TEXT,
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  keep_visible_after_last_date BOOLEAN NOT NULL DEFAULT FALSE,
  source TEXT NOT NULL DEFAULT 'Admin entry',
  status TEXT NOT NULL DEFAULT 'draft',
  seo_title TEXT NOT NULL DEFAULT '',
  meta_description TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

ALTER TABLE forms ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS organization TEXT;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS short_description TEXT NOT NULL DEFAULT '';
ALTER TABLE forms ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS last_date DATE;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS exam_date DATE;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS vacancy TEXT;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS qualification TEXT;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS eligibility TEXT;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS age_limit TEXT;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS application_fee TEXT;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS service_charge TEXT;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS required_documents TEXT NOT NULL DEFAULT '';
ALTER TABLE forms ADD COLUMN IF NOT EXISTS notification_pdf_url TEXT;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS official_notification_url TEXT;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS official_website_url TEXT;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS apply_online_url TEXT;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS keep_visible_after_last_date BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'Admin entry';
ALTER TABLE forms ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft';
ALTER TABLE forms ADD COLUMN IF NOT EXISTS seo_title TEXT NOT NULL DEFAULT '';
ALTER TABLE forms ADD COLUMN IF NOT EXISTS meta_description TEXT NOT NULL DEFAULT '';
ALTER TABLE forms ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE forms ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

UPDATE forms SET title = name WHERE title IS NULL;
UPDATE forms
SET slug = regexp_replace(lower(title), '[^a-z0-9]+', '-', 'g') || '-' || left(id::text, 8)
WHERE slug IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'forms_status_check' AND conrelid = 'public.forms'::regclass
  ) THEN
    ALTER TABLE public.forms
      ADD CONSTRAINT forms_status_check
      CHECK (status IN ('draft', 'pending-review', 'published', 'archived'));
  END IF;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_forms_slug ON forms(slug);
CREATE INDEX IF NOT EXISTS idx_forms_published_at
  ON forms(published_at DESC)
  WHERE status = 'published' AND active = TRUE;
CREATE INDEX IF NOT EXISTS idx_forms_status_category ON forms(status, category);
CREATE INDEX IF NOT EXISTS idx_forms_organization ON forms(organization);

CREATE OR REPLACE FUNCTION public.prepare_form_record()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  base_slug TEXT;
  candidate_slug TEXT;
  next_suffix INTEGER := 2;
BEGIN
  NEW.title = COALESCE(NULLIF(BTRIM(NEW.title), ''), NULLIF(BTRIM(NEW.name), ''));
  NEW.name = COALESCE(NULLIF(BTRIM(NEW.name), ''), NEW.title);
  IF TG_OP = 'INSERT' OR NEW.slug IS NULL OR BTRIM(NEW.slug) = '' THEN
    base_slug = trim(both '-' from regexp_replace(lower(COALESCE(NEW.title, '')), '[^a-z0-9]+', '-', 'g'));
    IF base_slug = '' THEN
      base_slug = 'form';
    END IF;
    PERFORM pg_advisory_xact_lock(hashtext(base_slug));
    candidate_slug = base_slug;
    WHILE EXISTS (
      SELECT 1 FROM public.forms existing
      WHERE existing.slug = candidate_slug AND existing.id IS DISTINCT FROM NEW.id
    ) LOOP
      candidate_slug = base_slug || '-' || next_suffix;
      next_suffix = next_suffix + 1;
    END LOOP;
    NEW.slug = candidate_slug;
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

CREATE TABLE IF NOT EXISTS form_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID REFERENCES forms(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  field_type TEXT NOT NULL,
  required BOOLEAN DEFAULT FALSE,
  options JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS document_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID REFERENCES notifications(id),
  document_name TEXT NOT NULL,
  required BOOLEAN DEFAULT TRUE,
  allowed_types TEXT[] DEFAULT ARRAY['pdf', 'jpg', 'jpeg', 'png'],
  max_size_mb INTEGER DEFAULT 5
);

CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  notification_id UUID REFERENCES notifications(id),
  form_slug TEXT,
  form_title TEXT,
  student_name TEXT,
  student_mobile TEXT,
  student_email TEXT,
  date_of_birth DATE,
  gender TEXT,
  service_name TEXT,
  status TEXT DEFAULT 'draft',
  payment_status TEXT DEFAULT 'pending',
  application_id TEXT UNIQUE,
  registration_number TEXT,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE applications ADD COLUMN IF NOT EXISTS form_slug TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS form_title TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS student_name TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS student_mobile TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS student_email TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS gender TEXT;
CREATE INDEX IF NOT EXISTS idx_applications_form_slug ON applications(form_slug);
CREATE INDEX IF NOT EXISTS idx_applications_created ON applications(created_at DESC);
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS application_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  field_value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  document_type TEXT,
  file_name TEXT,
  storage_path TEXT,
  mime_type TEXT,
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  form_slug TEXT,
  form_title TEXT,
  amount NUMERIC(10,2),
  official_application_fee TEXT,
  service_charge TEXT,
  payment_method TEXT DEFAULT 'UPI',
  utr_number TEXT,
  payment_screenshot_url TEXT,
  payment_status TEXT DEFAULT 'verification-pending',
  verified_by UUID REFERENCES admins(id),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE payments ADD COLUMN IF NOT EXISTS form_slug TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS form_title TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS official_application_fee TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS service_charge TEXT;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS notifications_user (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  notification_id UUID REFERENCES notifications(id),
  seen BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  sender_role TEXT,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS application_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  status TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  author_id UUID REFERENCES admins(id),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES users(id),
  actor_id UUID REFERENCES users(id),
  form_id UUID,
  action TEXT,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  amount NUMERIC(10,2),
  reason TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_category ON notifications(category);
CREATE INDEX IF NOT EXISTS idx_notifications_last_date ON notifications(last_date);
CREATE INDEX IF NOT EXISTS idx_applications_student ON applications(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_logs(actor_id);
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES users(id);
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS form_id UUID;
CREATE INDEX IF NOT EXISTS idx_audit_form_created ON audit_logs(form_id, created_at DESC);
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.users, public.admins, public.notifications, public.forms FROM PUBLIC;
REVOKE ALL ON public.users, public.admins FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.forms, public.notifications FROM anon, authenticated;
GRANT SELECT ON public.forms, public.notifications TO anon, authenticated;
GRANT ALL ON public.users, public.admins, public.forms, public.notifications TO service_role;
