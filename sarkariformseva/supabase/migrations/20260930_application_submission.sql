ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS form_slug TEXT;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS form_title TEXT;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS student_name TEXT;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS student_mobile TEXT;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS student_email TEXT;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS gender TEXT;

ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_applications_form_slug ON public.applications(form_slug);
CREATE INDEX IF NOT EXISTS idx_applications_created ON public.applications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_application_created ON public.payments(application_id, created_at DESC);

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
