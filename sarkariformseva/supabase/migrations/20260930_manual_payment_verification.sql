ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS form_slug TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS form_title TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS official_application_fee TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS service_charge TEXT;

CREATE INDEX IF NOT EXISTS idx_payments_pending_created
  ON public.payments(created_at DESC)
  WHERE payment_status = 'verification-pending';
CREATE INDEX IF NOT EXISTS idx_payments_form_slug ON public.payments(form_slug);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;