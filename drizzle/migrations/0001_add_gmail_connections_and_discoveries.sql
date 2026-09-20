CREATE TABLE public.app_user_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  connector_id text NOT NULL,
  connection_key_ciphertext text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, connector_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_user_connections TO service_role;

ALTER TABLE public.app_user_connections ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.email_discoveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  service_name text NOT NULL,
  benefit_kind text NOT NULL,
  benefit_name text NOT NULL,
  unit text NOT NULL,
  granted_amount numeric,
  remaining_amount numeric,
  trial_days integer,
  remaining_days integer,
  expires_at timestamptz,
  evidence_date timestamptz NOT NULL,
  evidence_subject text NOT NULL,
  confidence text NOT NULL,
  source_provider text NOT NULL DEFAULT 'gmail',
  source_message_id_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, source_provider, source_message_id_hash, benefit_name)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_discoveries TO authenticated;
GRANT ALL ON public.email_discoveries TO service_role;

ALTER TABLE public.email_discoveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY email_discoveries_select_own
ON public.email_discoveries FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY email_discoveries_insert_own
ON public.email_discoveries FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY email_discoveries_update_own
ON public.email_discoveries FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY email_discoveries_delete_own
ON public.email_discoveries FOR DELETE TO authenticated
USING (auth.uid() = user_id);

CREATE INDEX email_discoveries_user_date_idx
ON public.email_discoveries (user_id, evidence_date DESC);

CREATE TRIGGER app_user_connections_touch_updated_at
BEFORE UPDATE ON public.app_user_connections
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER email_discoveries_touch_updated_at
BEFORE UPDATE ON public.email_discoveries
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();