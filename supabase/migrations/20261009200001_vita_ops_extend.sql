CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.is_staff(_uid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = _uid
      AND role IN (
        'ADMIN'::public.user_role,
        'GESTIONNAIRE'::public.user_role,
        'DISPATCH'::public.user_role,
        'SUIVI'::public.user_role,
        'SUPPORT'::public.user_role,
        'COMPTABLE'::public.user_role,
        'FINANCE'::public.user_role
      )
  )
$$;

CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;

ALTER TABLE public.zones ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'served';
ALTER TABLE public.zones ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.zones ADD COLUMN IF NOT EXISTS effective_from TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS sender_name TEXT,
  ADD COLUMN IF NOT EXISTS sender_phone TEXT,
  ADD COLUMN IF NOT EXISTS recipient_name TEXT,
  ADD COLUMN IF NOT EXISTS recipient_phone TEXT,
  ADD COLUMN IF NOT EXISTS commune TEXT,
  ADD COLUMN IF NOT EXISTS weight_kg NUMERIC(8,2),
  ADD COLUMN IF NOT EXISTS length_cm NUMERIC(8,2),
  ADD COLUMN IF NOT EXISTS width_cm NUMERIC(8,2),
  ADD COLUMN IF NOT EXISTS height_cm NUMERIC(8,2),
  ADD COLUMN IF NOT EXISTS declared_value_fc NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS fragile BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS packaging_state TEXT,
  ADD COLUMN IF NOT EXISTS handling_notes TEXT,
  ADD COLUMN IF NOT EXISTS time_window TEXT,
  ADD COLUMN IF NOT EXISTS service_type TEXT DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS declared_confirmed BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS evaluation_level TEXT,
  ADD COLUMN IF NOT EXISTS evaluation_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS quote_snapshot JSONB,
  ADD COLUMN IF NOT EXISTS pricing_version TEXT,
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS otp_hash TEXT,
  ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS otp_attempts INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS kpay_refid TEXT,
  ADD COLUMN IF NOT EXISTS kpay_status TEXT,
  ADD COLUMN IF NOT EXISTS payment_method TEXT,
  ADD COLUMN IF NOT EXISTS payment_status TEXT;

CREATE TABLE IF NOT EXISTS public.parcel_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'main',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.parcel_photos ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.evaluation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  actor_id UUID,
  level TEXT NOT NULL,
  reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.evaluation_logs ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT NOT NULL UNIQUE,
  active BOOLEAN NOT NULL DEFAULT false,
  rules JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;

INSERT INTO public.pricing_rules (version, active, rules)
VALUES (
  '2026-10-grid-1',
  true,
  '{"baseFc":1500,"perKmFc":500,"minFc":2000,"weightStepKg":5,"weightSurchargeFc":300,"volumetricEnabled":false,"urgentSurchargeFc":1000,"specialHandlingFc":500,"declaredValueRate":0,"trafficEnabled":false}'::jsonb
)
ON CONFLICT (version) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.driver_pings (
  driver_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  latitude NUMERIC(10,7) NOT NULL,
  longitude NUMERIC(10,7) NOT NULL,
  heading NUMERIC(6,2),
  speed NUMERIC(6,2),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.driver_pings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_pings REPLICA IDENTITY FULL;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_pings;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID REFERENCES public.driver_profiles(user_id) ON DELETE SET NULL,
  plate TEXT,
  operational BOOLEAN NOT NULL DEFAULT true,
  capacity_kg NUMERIC(8,2) NOT NULL DEFAULT 20,
  odometer_km NUMERIC(10,1) DEFAULT 0,
  insurance_ref TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.cost_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.cost_entries ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_key TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'whatsapp',
  phone TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ,
  UNIQUE (event_key)
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID,
  action TEXT NOT NULL,
  entity TEXT,
  entity_id UUID,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.groq_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  model TEXT,
  observations TEXT,
  hypotheses TEXT,
  confidence NUMERIC(4,3),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.groq_analyses ENABLE ROW LEVEL SECURITY;

INSERT INTO storage.buckets (id, name, public)
VALUES ('parcel-photos', 'parcel-photos', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Staff reads companies" ON public.companies;
CREATE POLICY "Staff reads companies" ON public.companies FOR SELECT USING (public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "Staff writes companies" ON public.companies;
CREATE POLICY "Staff writes companies" ON public.companies FOR ALL USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Staff all orders" ON public.orders;
CREATE POLICY "Staff all orders" ON public.orders FOR ALL USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Staff users" ON public.users;
CREATE POLICY "Staff users" ON public.users FOR SELECT USING (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Staff eval" ON public.evaluation_logs;
CREATE POLICY "Staff eval" ON public.evaluation_logs FOR ALL USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Staff pricing" ON public.pricing_rules;
CREATE POLICY "Staff pricing" ON public.pricing_rules FOR SELECT USING (public.is_staff(auth.uid()) OR true);
DROP POLICY IF EXISTS "Staff pricing write" ON public.pricing_rules;
CREATE POLICY "Staff pricing write" ON public.pricing_rules FOR ALL USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Own ping" ON public.driver_pings;
CREATE POLICY "Own ping" ON public.driver_pings FOR ALL USING (auth.uid() = driver_id) WITH CHECK (auth.uid() = driver_id);
DROP POLICY IF EXISTS "Staff pings" ON public.driver_pings;
CREATE POLICY "Staff pings" ON public.driver_pings FOR SELECT USING (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Staff vehicles" ON public.vehicles;
CREATE POLICY "Staff vehicles" ON public.vehicles FOR ALL USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "Driver own vehicle" ON public.vehicles;
CREATE POLICY "Driver own vehicle" ON public.vehicles FOR SELECT USING (driver_id = auth.uid());

DROP POLICY IF EXISTS "Staff costs" ON public.cost_entries;
CREATE POLICY "Staff costs" ON public.cost_entries FOR ALL USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Staff notify" ON public.notifications;
CREATE POLICY "Staff notify" ON public.notifications FOR ALL USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Staff audit" ON public.audit_events;
CREATE POLICY "Staff audit" ON public.audit_events FOR SELECT USING (public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "Staff audit ins" ON public.audit_events;
CREATE POLICY "Staff audit ins" ON public.audit_events FOR INSERT WITH CHECK (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Staff groq" ON public.groq_analyses;
CREATE POLICY "Staff groq" ON public.groq_analyses FOR SELECT USING (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Client photos" ON public.parcel_photos;
CREATE POLICY "Client photos" ON public.parcel_photos FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = parcel_photos.order_id AND o.client_id = auth.uid())
);
DROP POLICY IF EXISTS "Staff photos" ON public.parcel_photos;
CREATE POLICY "Staff photos" ON public.parcel_photos FOR ALL USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "Client insert photos" ON public.parcel_photos;
CREATE POLICY "Client insert photos" ON public.parcel_photos FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.client_id = auth.uid())
);

CREATE OR REPLACE FUNCTION public.verify_delivery_code(p_order_id UUID, p_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order RECORD;
  v_hash TEXT;
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Commande introuvable');
  END IF;
  IF v_order.driver_id IS DISTINCT FROM auth.uid() AND NOT public.is_staff(auth.uid()) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Non autorisé');
  END IF;
  IF v_order.status = 'DELIVERED' THEN
    RETURN jsonb_build_object('success', true, 'message', 'Déjà livrée');
  END IF;
  IF v_order.otp_expires_at IS NOT NULL AND v_order.otp_expires_at < now() THEN
    RETURN jsonb_build_object('success', false, 'message', 'Code expiré');
  END IF;
  IF v_order.otp_attempts >= 5 THEN
    RETURN jsonb_build_object('success', false, 'message', 'Trop de tentatives');
  END IF;
  v_hash := encode(digest(trim(p_code), 'sha256'), 'hex');
  IF v_order.otp_hash IS NULL OR v_order.otp_hash <> v_hash THEN
    UPDATE public.orders SET otp_attempts = otp_attempts + 1 WHERE id = p_order_id;
    RETURN jsonb_build_object('success', false, 'message', 'Code incorrect');
  END IF;
  UPDATE public.orders SET status = 'DELIVERED', delivered_at = now(), otp_hash = NULL WHERE id = p_order_id;
  RETURN jsonb_build_object('success', true, 'message', 'Livraison validée');
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_delivery_code(uuid, text) TO authenticated;
