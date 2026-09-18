-- Services owned by a user
CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  provider text,
  plan_name text,
  account_label text,
  timezone text NOT NULL DEFAULT 'Asia/Seoul',
  subscription_status text NOT NULL DEFAULT 'active'
    CHECK (subscription_status IN ('active','trial','trial_ended','paused','cancelled','unknown')),
  trial_ends_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.services TO authenticated;
GRANT ALL ON public.services TO service_role;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "services_select_own" ON public.services FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "services_insert_own" ON public.services FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "services_update_own" ON public.services FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "services_delete_own" ON public.services FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Benefits (quotas / credits) belonging to a service
CREATE TABLE public.benefits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  name text NOT NULL,
  unit text NOT NULL,
  -- null = unknown, 0 = explicitly zero. Never coalesce these together.
  granted_amount numeric,
  remaining_amount numeric,
  monthly_cap numeric,
  extra_limit_note text,
  reset_rule text NOT NULL DEFAULT 'none'
    CHECK (reset_rule IN ('none','daily','weekly','monthly','yearly','custom','unknown')),
  reset_anchor timestamptz,
  -- provenance
  observed_at timestamptz NOT NULL,
  observed_precision text NOT NULL DEFAULT 'minute'
    CHECK (observed_precision IN ('minute','day')),
  observed_timezone text NOT NULL DEFAULT 'Asia/Seoul',
  source_kind text NOT NULL DEFAULT 'manual'
    CHECK (source_kind IN ('manual','ai_text','ai_image','import')),
  source_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX benefits_user_service_idx ON public.benefits (user_id, service_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.benefits TO authenticated;
GRANT ALL ON public.benefits TO service_role;
ALTER TABLE public.benefits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "benefits_select_own" ON public.benefits FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "benefits_insert_own" ON public.benefits FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "benefits_update_own" ON public.benefits FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "benefits_delete_own" ON public.benefits FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Server-enforced AI usage counter (per user, per UTC day)
CREATE TABLE public.ai_usage (
  user_id uuid NOT NULL,
  usage_date date NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  call_count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, usage_date)
);

-- Only the server role touches this table; users may read their own counter.
GRANT SELECT ON public.ai_usage TO authenticated;
GRANT ALL ON public.ai_usage TO service_role;
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_usage_select_own" ON public.ai_usage FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Atomic rate limit: returns remaining calls, or -1 when over the limit.
CREATE OR REPLACE FUNCTION public.consume_ai_quota(_user_id uuid, _daily_limit integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _count integer;
BEGIN
  INSERT INTO public.ai_usage (user_id, usage_date, call_count)
  VALUES (_user_id, (now() AT TIME ZONE 'utc')::date, 1)
  ON CONFLICT (user_id, usage_date)
  DO UPDATE SET call_count = public.ai_usage.call_count + 1, updated_at = now()
  WHERE public.ai_usage.call_count < _daily_limit
  RETURNING call_count INTO _count;

  IF _count IS NULL THEN
    RETURN -1;
  END IF;

  RETURN _daily_limit - _count;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_ai_quota(uuid, integer) FROM public;
GRANT EXECUTE ON FUNCTION public.consume_ai_quota(uuid, integer) TO service_role;

-- updated_at maintenance
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER services_touch_updated_at BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER benefits_touch_updated_at BEFORE UPDATE ON public.benefits
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();