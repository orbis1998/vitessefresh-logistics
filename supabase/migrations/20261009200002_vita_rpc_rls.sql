-- RPC assign_driver, notifications helpers, extra RLS, support, ops flags.
-- Additive only. Do not DROP tables.

CREATE TABLE IF NOT EXISTS public.company_members (
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  PRIMARY KEY (company_id, user_id)
);
ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.ops_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT 'false'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ops_settings ENABLE ROW LEVEL SECURITY;
INSERT INTO public.ops_settings (key, value)
VALUES ('auto_assign', 'false'::jsonb)
ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.support_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.support_threads ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.support_threads(id) ON DELETE CASCADE,
  sender_id UUID,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff companies members" ON public.company_members;
CREATE POLICY "Staff companies members" ON public.company_members
  FOR ALL USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "Own company membership" ON public.company_members;
CREATE POLICY "Own company membership" ON public.company_members
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Staff ops settings" ON public.ops_settings;
CREATE POLICY "Staff ops settings" ON public.ops_settings
  FOR ALL USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "Read ops settings" ON public.ops_settings;
CREATE POLICY "Read ops settings" ON public.ops_settings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Client own orders sel" ON public.orders;
CREATE POLICY "Client own orders sel" ON public.orders
  FOR SELECT USING (client_id = auth.uid() OR public.is_staff(auth.uid()) OR driver_id = auth.uid());
DROP POLICY IF EXISTS "Client insert orders" ON public.orders;
CREATE POLICY "Client insert orders" ON public.orders
  FOR INSERT WITH CHECK (client_id = auth.uid());
DROP POLICY IF EXISTS "Client update own draft" ON public.orders;
CREATE POLICY "Client update own draft" ON public.orders
  FOR UPDATE USING (client_id = auth.uid() AND status IN ('DRAFT'::public.order_status, 'SUBMITTED'::public.order_status));
DROP POLICY IF EXISTS "Driver update assigned" ON public.orders;
CREATE POLICY "Driver update assigned" ON public.orders
  FOR UPDATE USING (driver_id = auth.uid());

DROP POLICY IF EXISTS "Client own threads" ON public.support_threads;
CREATE POLICY "Client own threads" ON public.support_threads
  FOR ALL USING (client_id = auth.uid() OR public.is_staff(auth.uid()))
  WITH CHECK (client_id = auth.uid() OR public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "Thread messages" ON public.support_messages;
CREATE POLICY "Thread messages" ON public.support_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.support_threads t
      WHERE t.id = thread_id AND (t.client_id = auth.uid() OR public.is_staff(auth.uid()))
    )
  );
DROP POLICY IF EXISTS "Thread messages ins" ON public.support_messages;
CREATE POLICY "Thread messages ins" ON public.support_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.support_threads t
      WHERE t.id = thread_id AND (t.client_id = auth.uid() OR public.is_staff(auth.uid()))
    )
  );

DROP POLICY IF EXISTS "Driver insert photos storage" ON storage.objects;
CREATE POLICY "Client upload parcel photos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'parcel-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
DROP POLICY IF EXISTS "Client read parcel photos" ON storage.objects;
CREATE POLICY "Client read parcel photos" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'parcel-photos'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.is_staff(auth.uid())
    )
  );

CREATE OR REPLACE FUNCTION public.assign_driver(p_order_id UUID, p_driver_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order RECORD;
  v_capacity NUMERIC;
  v_active INT;
  v_auto JSONB;
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Non autorisé');
  END IF;
  SELECT value INTO v_auto FROM public.ops_settings WHERE key = 'auto_assign';
  -- auto_assign remains off; this RPC is always explicit (human).
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Commande introuvable');
  END IF;
  IF v_order.evaluation_level = 'RED' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Contrôle rouge : attribution interdite');
  END IF;
  IF v_order.evaluation_level = 'YELLOW' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Contrôle jaune : validation humaine requise');
  END IF;
  IF v_order.status IS DISTINCT FROM 'ACCEPTED'::public.order_status THEN
    RETURN jsonb_build_object('ok', false, 'error', 'La commande n''est pas acceptée');
  END IF;
  IF v_order.driver_id IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Déjà attribuée');
  END IF;
  SELECT capacity_kg INTO v_capacity
  FROM public.vehicles
  WHERE driver_id = p_driver_id AND operational = true
  ORDER BY created_at DESC
  LIMIT 1;
  IF v_capacity IS NULL THEN
    v_capacity := 20;
  END IF;
  IF v_order.weight_kg IS NOT NULL AND v_order.weight_kg > v_capacity THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Capacité moto insuffisante');
  END IF;
  SELECT count(*) INTO v_active
  FROM public.orders
  WHERE driver_id = p_driver_id
    AND status IN (
      'ACCEPTED'::public.order_status,
      'ASSIGNED'::public.order_status,
      'COLLECTING'::public.order_status,
      'PICKED_UP'::public.order_status,
      'IN_TRANSIT'::public.order_status
    );
  IF v_active >= 3 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Livreur déjà saturé');
  END IF;
  UPDATE public.orders
  SET driver_id = p_driver_id, status = 'ASSIGNED'::public.order_status
  WHERE id = p_order_id;
  INSERT INTO public.audit_events (actor_id, action, entity, entity_id, meta)
  VALUES (auth.uid(), 'assign_driver', 'order', p_order_id, jsonb_build_object('driver_id', p_driver_id));
  RETURN jsonb_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.enqueue_notification(
  p_event_key TEXT,
  p_phone TEXT,
  p_body TEXT,
  p_order_id UUID DEFAULT NULL,
  p_channel TEXT DEFAULT 'whatsapp'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.notifications (event_key, channel, phone, body, order_id, status)
  VALUES (p_event_key, p_channel, p_phone, p_body, p_order_id, 'pending')
  ON CONFLICT (event_key) DO NOTHING
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.assign_driver(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.enqueue_notification(text, text, text, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.enqueue_notification(text, text, text, uuid, text) TO service_role;
