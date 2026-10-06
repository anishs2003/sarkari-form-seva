CREATE UNIQUE INDEX IF NOT EXISTS idx_forms_slug ON public.forms(slug);

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
      SELECT 1
      FROM public.forms existing
      WHERE existing.slug = candidate_slug
        AND existing.id IS DISTINCT FROM NEW.id
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
