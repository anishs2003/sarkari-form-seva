-- Safe, rerunnable schema for the current Forms, Notifications, admin, and
-- application/payment APIs. This migration does not UPDATE or DELETE rows.

BEGIN;

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'student',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'admin',
  mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notifications (
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
  required_documents TEXT,
  notification_pdf_url TEXT,
  official_notification_url TEXT,
  official_pdf_url TEXT,
  apply_online_url TEXT,
  official_website_url TEXT,
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  keep_visible_after_last_date BOOLEAN NOT NULL DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  publish_date TIMESTAMPTZ,
  source TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  seo_title TEXT,
  meta_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT notifications_status_check
    CHECK (status IN ('draft', 'pending-review', 'approved', 'published', 'rejected', 'archived'))
);

CREATE TABLE IF NOT EXISTS public.forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  notification_id UUID REFERENCES public.notifications(id) ON DELETE SET NULL,
  active BOOLEAN NOT NULL DEFAULT FALSE,
  slug TEXT,
  title TEXT NOT NULL,
  organization TEXT,
  category TEXT,
  short_description TEXT,
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
  required_documents TEXT,
  notification_pdf_url TEXT,
  official_notification_url TEXT,
  official_website_url TEXT,
  apply_online_url TEXT,
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  keep_visible_after_last_date BOOLEAN NOT NULL DEFAULT FALSE,
  source TEXT NOT NULL DEFAULT 'Admin entry',
  status TEXT NOT NULL DEFAULT 'draft',
  seo_title TEXT,
  meta_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  CONSTRAINT forms_status_check
    CHECK (status IN ('draft', 'pending-review', 'published', 'archived'))
);

CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT,
  mobile TEXT,
  email TEXT,
  otp_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
  notification_id UUID REFERENCES public.notifications(id) ON DELETE SET NULL,
  form_slug TEXT,
  form_title TEXT,
  student_name TEXT,
  student_mobile TEXT,
  student_email TEXT,
  date_of_birth DATE,
  gender TEXT,
  service_name TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  payment_status TEXT NOT NULL DEFAULT 'pending',
  application_id TEXT UNIQUE,
  registration_number TEXT,
  admin_message TEXT NOT NULL DEFAULT '',
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
  document_type TEXT,
  file_name TEXT,
  storage_path TEXT,
  mime_type TEXT,
  uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
  form_slug TEXT,
  form_title TEXT,
  amount NUMERIC(10,2),
  official_application_fee TEXT,
  service_charge TEXT,
  payment_method TEXT NOT NULL DEFAULT 'UPI',
  utr_number TEXT,
  payment_screenshot_url TEXT,
  payment_status TEXT NOT NULL DEFAULT 'verification-pending',
  verified_by UUID REFERENCES public.admins(id) ON DELETE SET NULL,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  actor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  form_id UUID,
  action TEXT,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add columns expected by the current code when an existing table is partial.
-- New columns remain nullable on existing rows; no production row is rewritten.
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS role TEXT;
ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN;
ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ;

ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS organization TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS short_description TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS qualification TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS last_date DATE;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS exam_date DATE;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS vacancy TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS eligibility TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS age_limit TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS application_fee TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS service_charge TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS required_documents TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS notification_pdf_url TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS official_notification_url TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS official_pdf_url TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS apply_online_url TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS official_website_url TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS featured BOOLEAN;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS keep_visible_after_last_date BOOLEAN;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS publish_date TIMESTAMPTZ;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS seo_title TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS meta_description TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

ALTER TABLE public.forms ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.forms ADD COLUMN IF NOT EXISTS notification_id UUID;
ALTER TABLE public.forms ADD COLUMN IF NOT EXISTS active BOOLEAN;
ALTER TABLE public.forms ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE public.forms ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.forms ADD COLUMN IF NOT EXISTS organization TEXT;
ALTER TABLE public.forms ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.forms ADD COLUMN IF NOT EXISTS short_description TEXT;
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
ALTER TABLE public.forms ADD COLUMN IF NOT EXISTS required_documents TEXT;
ALTER TABLE public.forms ADD COLUMN IF NOT EXISTS notification_pdf_url TEXT;
ALTER TABLE public.forms ADD COLUMN IF NOT EXISTS official_notification_url TEXT;
ALTER TABLE public.forms ADD COLUMN IF NOT EXISTS official_website_url TEXT;
ALTER TABLE public.forms ADD COLUMN IF NOT EXISTS apply_online_url TEXT;
ALTER TABLE public.forms ADD COLUMN IF NOT EXISTS featured BOOLEAN;
ALTER TABLE public.forms ADD COLUMN IF NOT EXISTS keep_visible_after_last_date BOOLEAN;
ALTER TABLE public.forms ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE public.forms ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE public.forms ADD COLUMN IF NOT EXISTS seo_title TEXT;
ALTER TABLE public.forms ADD COLUMN IF NOT EXISTS meta_description TEXT;
ALTER TABLE public.forms ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ;
ALTER TABLE public.forms ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
ALTER TABLE public.forms ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS student_id UUID;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS notification_id UUID;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS form_slug TEXT;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS form_title TEXT;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS student_name TEXT;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS student_mobile TEXT;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS student_email TEXT;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS service_name TEXT;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS payment_status TEXT;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS application_id TEXT;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS registration_number TEXT;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS admin_message TEXT;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS application_id UUID;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS document_type TEXT;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS file_name TEXT;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS storage_path TEXT;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS mime_type TEXT;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS uploaded_by UUID;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ;

ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS application_id UUID;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS form_slug TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS form_title TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS amount NUMERIC(10,2);
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS official_application_fee TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS service_charge TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS utr_number TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS payment_screenshot_url TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS payment_status TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS verified_by UUID;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ;

ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS admin_id UUID;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS actor_id UUID;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS form_id UUID;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS action TEXT;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS entity_type TEXT;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS entity_id UUID;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS metadata JSONB;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ;

-- Defaults below affect future inserts only; no existing row values are filled.
ALTER TABLE public.users ALTER COLUMN role SET DEFAULT 'student';
ALTER TABLE public.users ALTER COLUMN created_at SET DEFAULT NOW();
ALTER TABLE public.users ALTER COLUMN updated_at SET DEFAULT NOW();
ALTER TABLE public.admins ALTER COLUMN role SET DEFAULT 'admin';
ALTER TABLE public.admins ALTER COLUMN mfa_enabled SET DEFAULT FALSE;
ALTER TABLE public.admins ALTER COLUMN created_at SET DEFAULT NOW();
ALTER TABLE public.notifications ALTER COLUMN featured SET DEFAULT FALSE;
ALTER TABLE public.notifications ALTER COLUMN keep_visible_after_last_date SET DEFAULT FALSE;
ALTER TABLE public.notifications ALTER COLUMN status SET DEFAULT 'draft';
ALTER TABLE public.notifications ALTER COLUMN created_at SET DEFAULT NOW();
ALTER TABLE public.notifications ALTER COLUMN updated_at SET DEFAULT NOW();
ALTER TABLE public.forms ALTER COLUMN active SET DEFAULT FALSE;
ALTER TABLE public.forms ALTER COLUMN featured SET DEFAULT FALSE;
ALTER TABLE public.forms ALTER COLUMN keep_visible_after_last_date SET DEFAULT FALSE;
ALTER TABLE public.forms ALTER COLUMN source SET DEFAULT 'Admin entry';
ALTER TABLE public.forms ALTER COLUMN status SET DEFAULT 'draft';
ALTER TABLE public.forms ALTER COLUMN created_at SET DEFAULT NOW();
ALTER TABLE public.forms ALTER COLUMN updated_at SET DEFAULT NOW();
ALTER TABLE public.applications ALTER COLUMN status SET DEFAULT 'draft';
ALTER TABLE public.applications ALTER COLUMN payment_status SET DEFAULT 'pending';
ALTER TABLE public.applications ALTER COLUMN admin_message SET DEFAULT '';
ALTER TABLE public.applications ALTER COLUMN created_at SET DEFAULT NOW();
ALTER TABLE public.applications ALTER COLUMN updated_at SET DEFAULT NOW();
ALTER TABLE public.documents ALTER COLUMN created_at SET DEFAULT NOW();
ALTER TABLE public.payments ALTER COLUMN payment_method SET DEFAULT 'UPI';
ALTER TABLE public.payments ALTER COLUMN payment_status SET DEFAULT 'verification-pending';
ALTER TABLE public.payments ALTER COLUMN created_at SET DEFAULT NOW();
ALTER TABLE public.audit_logs ALTER COLUMN metadata SET DEFAULT '{}'::JSONB;
ALTER TABLE public.audit_logs ALTER COLUMN created_at SET DEFAULT NOW();

-- Status checks are NOT VALID on existing tables: existing rows are preserved,
-- while new inserts/updates must use statuses supported by the application.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'forms_status_check' AND conrelid = 'public.forms'::regclass) THEN
    ALTER TABLE public.forms ADD CONSTRAINT forms_status_check
      CHECK (status IN ('draft', 'pending-review', 'published', 'archived')) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notifications_status_check' AND conrelid = 'public.notifications'::regclass) THEN
    ALTER TABLE public.notifications ADD CONSTRAINT notifications_status_check
      CHECK (status IN ('draft', 'pending-review', 'approved', 'published', 'rejected', 'archived')) NOT VALID;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_forms_slug_lookup ON public.forms(slug);
CREATE INDEX IF NOT EXISTS idx_forms_status_active_published ON public.forms(status, active, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_forms_category ON public.forms(category);
CREATE INDEX IF NOT EXISTS idx_notifications_slug_lookup ON public.notifications(slug);
CREATE INDEX IF NOT EXISTS idx_notifications_status_published ON public.notifications(status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_category ON public.notifications(category);
CREATE INDEX IF NOT EXISTS idx_users_email_lookup ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_admins_user_id ON public.admins(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_form_slug ON public.applications(form_slug);
CREATE INDEX IF NOT EXISTS idx_applications_created_at ON public.applications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_application_id ON public.documents(application_id);
CREATE INDEX IF NOT EXISTS idx_payments_status_created ON public.payments(payment_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_application_id ON public.payments(application_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_form_created ON public.audit_logs(form_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

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
    IF base_slug = '' THEN base_slug = 'form'; END IF;
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

CREATE OR REPLACE FUNCTION public.prepare_notification_record()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  base_slug TEXT;
  candidate_slug TEXT;
  next_suffix INTEGER := 2;
BEGIN
  IF NEW.slug IS NULL OR BTRIM(NEW.slug) = '' THEN
    base_slug = trim(both '-' from regexp_replace(lower(COALESCE(NEW.title, '')), '[^a-z0-9]+', '-', 'g'));
    IF base_slug = '' THEN base_slug = 'notification'; END IF;
    PERFORM pg_advisory_xact_lock(hashtext('notification:' || base_slug));
    candidate_slug = base_slug;
    WHILE EXISTS (
      SELECT 1 FROM public.notifications existing
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
  FOR EACH ROW EXECUTE FUNCTION public.prepare_form_record();

DROP TRIGGER IF EXISTS prepare_notification_record ON public.notifications;
CREATE TRIGGER prepare_notification_record
  BEFORE INSERT OR UPDATE ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.prepare_notification_record();

DROP TRIGGER IF EXISTS set_users_updated_at ON public.users;
CREATE TRIGGER set_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS set_applications_updated_at ON public.applications;
CREATE TRIGGER set_applications_updated_at BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Replace existing catalog policies so no legacy permissive policy can expose
-- drafts/inactive rows. Other table policies are left untouched.
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

CREATE POLICY public_read_published_forms
  ON public.forms FOR SELECT TO anon, authenticated
  USING (status = 'published' AND active = TRUE);
CREATE POLICY public_read_published_notifications
  ON public.notifications FOR SELECT TO anon, authenticated
  USING (status = 'published');

REVOKE ALL PRIVILEGES ON TABLE
  public.users, public.admins, public.students, public.forms, public.notifications,
  public.applications, public.documents, public.payments, public.audit_logs
FROM PUBLIC, anon, authenticated;

GRANT SELECT ON TABLE public.forms, public.notifications TO anon, authenticated;
GRANT ALL PRIVILEGES ON TABLE
  public.users, public.admins, public.students, public.forms, public.notifications,
  public.applications, public.documents, public.payments, public.audit_logs
TO service_role;

-- Create the private upload bucket only if it is absent. Preserve existing
-- bucket metadata and objects.
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', FALSE)
ON CONFLICT (id) DO NOTHING;

COMMIT;

NOTIFY pgrst, 'reload schema';