-- Helpers
CREATE OR REPLACE FUNCTION public.is_ops(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN (
        'admin'::public.app_role,
        'gestionnaire'::public.app_role,
        'call_center'::public.app_role,
        'suivi'::public.app_role,
        'support'::public.app_role,
        'comptable'::public.app_role,
        'finance'::public.app_role
      )
  )
$$;

CREATE OR REPLACE FUNCTION public.is_finance_staff(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN (
        'admin'::public.app_role,
        'comptable'::public.app_role,
        'finance'::public.app_role
      )
  )
$$;

GRANT EXECUTE ON FUNCTION public.is_ops(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_finance_staff(uuid) TO authenticated;

-- Orders: K-Pay + org
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS organization_id UUID,
  ADD COLUMN IF NOT EXISTS kpay_refid TEXT,
  ADD COLUMN IF NOT EXISTS kpay_status TEXT,
  ADD COLUMN IF NOT EXISTS package_type TEXT;

-- Organizations
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  plan_id UUID REFERENCES public.pricing_plans(id) ON DELETE SET NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id)
);
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_organization_id_fkey;
ALTER TABLE public.orders
  ADD CONSTRAINT orders_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE SET NULL;

-- Subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.pricing_plans(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'active',
  credits_remaining INT NOT NULL DEFAULT 0,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Ledger
CREATE TABLE IF NOT EXISTS public.ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'CDF',
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;

-- Support
CREATE TABLE IF NOT EXISTS public.support_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  client_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.support_threads ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.support_threads(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- WhatsApp outbox
CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  body TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'otp',
  status TEXT NOT NULL DEFAULT 'pending',
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ
);
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- Audit
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity TEXT,
  entity_id UUID,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_messages;

-- Ledger on delivered
CREATE OR REPLACE FUNCTION public.ledger_on_delivered()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'delivered' AND (OLD.status IS DISTINCT FROM 'delivered') THEN
    INSERT INTO public.ledger_entries (kind, amount, order_id, user_id, organization_id, note)
    VALUES (
      'delivery_fee',
      NEW.price,
      NEW.id,
      NEW.client_id,
      NEW.organization_id,
      'Frais de course livrée'
    );
    INSERT INTO public.whatsapp_messages (phone, body, kind, order_id)
    SELECT NEW.recipient_phone,
      'Vita Express : votre colis a été livré. Merci.',
      'delivered',
      NEW.id
    WHERE NEW.recipient_phone IS NOT NULL AND NEW.recipient_phone <> '';
    INSERT INTO public.whatsapp_messages (phone, body, kind, order_id)
    SELECT p.phone,
      'Vita Express : votre course a été livrée.',
      'delivered_client',
      NEW.id
    FROM public.profiles p
    WHERE p.user_id = NEW.client_id AND p.phone IS NOT NULL AND p.phone <> '';
    IF NEW.driver_id IS NOT NULL THEN
      INSERT INTO public.ledger_entries (kind, amount, order_id, user_id, organization_id, note)
      VALUES (
        'driver_commission',
        ROUND(NEW.price * 0.7, 2),
        NEW.id,
        NEW.driver_id,
        NEW.organization_id,
        'Commission livreur 70%'
      );
    END IF;
    IF NEW.payment_method IN ('kpay', 'flexpay') THEN
      INSERT INTO public.ledger_entries (kind, amount, order_id, user_id, organization_id, note)
      VALUES ('kpay_collect', NEW.price, NEW.id, NEW.client_id, NEW.organization_id, 'Collecte Mobile Money');
    END IF;
    UPDATE public.subscriptions
    SET credits_remaining = GREATEST(credits_remaining - 1, 0)
    WHERE status = 'active'
      AND (
        (NEW.organization_id IS NOT NULL AND organization_id = NEW.organization_id)
        OR (NEW.organization_id IS NULL AND user_id = NEW.client_id)
      );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_orders_ledger_delivered ON public.orders;
CREATE TRIGGER trg_orders_ledger_delivered
AFTER UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.ledger_on_delivered();

-- OTP WhatsApp on insert
CREATE OR REPLACE FUNCTION public.enqueue_otp_whatsapp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.recipient_phone IS NOT NULL AND NEW.recipient_phone <> '' AND NEW.delivery_otp IS NOT NULL THEN
    INSERT INTO public.whatsapp_messages (phone, body, kind, order_id)
    VALUES (
      NEW.recipient_phone,
      'Vita Express : votre code de remise est ' || NEW.delivery_otp || '. Ne le communiquez qu''au livreur.',
      'otp',
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_orders_otp_whatsapp ON public.orders;
CREATE TRIGGER trg_orders_otp_whatsapp
AFTER INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.enqueue_otp_whatsapp();

-- RLS
CREATE POLICY "Ops view all profiles" ON public.profiles
  FOR SELECT USING (public.is_ops(auth.uid()));
CREATE POLICY "Ops view all roles" ON public.user_roles
  FOR SELECT USING (public.is_ops(auth.uid()));
CREATE POLICY "Ops view all orders" ON public.orders
  FOR SELECT USING (public.is_ops(auth.uid()));
CREATE POLICY "Ops manage orders" ON public.orders
  FOR ALL USING (public.is_ops(auth.uid()))
  WITH CHECK (public.is_ops(auth.uid()));
CREATE POLICY "Ops view drivers" ON public.driver_profiles
  FOR SELECT USING (public.is_ops(auth.uid()));
CREATE POLICY "Ops manage drivers" ON public.driver_profiles
  FOR ALL USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestionnaire'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestionnaire'));
CREATE POLICY "Ops view locations" ON public.driver_locations
  FOR SELECT USING (public.is_ops(auth.uid()));

CREATE POLICY "Ops orgs" ON public.organizations
  FOR ALL USING (public.is_ops(auth.uid()))
  WITH CHECK (public.is_ops(auth.uid()));
CREATE POLICY "Member views org" ON public.organizations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organization_members m
      WHERE m.organization_id = organizations.id AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "Ops org members" ON public.organization_members
  FOR ALL USING (public.is_ops(auth.uid()))
  WITH CHECK (public.is_ops(auth.uid()));
CREATE POLICY "Member sees membership" ON public.organization_members
  FOR SELECT USING (user_id = auth.uid() OR public.is_ops(auth.uid()));

CREATE POLICY "Finance subscriptions" ON public.subscriptions
  FOR ALL USING (public.is_finance_staff(auth.uid()) OR public.is_ops(auth.uid()))
  WITH CHECK (public.is_finance_staff(auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Own subscription" ON public.subscriptions
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.organization_members m
      WHERE m.organization_id = subscriptions.organization_id AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "Finance ledger" ON public.ledger_entries
  FOR SELECT USING (public.is_finance_staff(auth.uid()) OR public.is_ops(auth.uid()));
CREATE POLICY "Finance ledger write" ON public.ledger_entries
  FOR INSERT WITH CHECK (public.is_finance_staff(auth.uid()) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Ops support threads" ON public.support_threads
  FOR ALL USING (public.is_ops(auth.uid()))
  WITH CHECK (public.is_ops(auth.uid()));
CREATE POLICY "Client own threads" ON public.support_threads
  FOR SELECT USING (client_id = auth.uid());
CREATE POLICY "Client insert threads" ON public.support_threads
  FOR INSERT WITH CHECK (client_id = auth.uid());

CREATE POLICY "Ops support messages" ON public.support_messages
  FOR ALL USING (public.is_ops(auth.uid()))
  WITH CHECK (public.is_ops(auth.uid()));
CREATE POLICY "Client thread messages" ON public.support_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.support_threads t
      WHERE t.id = support_messages.thread_id AND t.client_id = auth.uid()
    )
  );
CREATE POLICY "Client send messages" ON public.support_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.support_threads t
      WHERE t.id = support_messages.thread_id AND t.client_id = auth.uid()
    )
  );

CREATE POLICY "Ops whatsapp" ON public.whatsapp_messages
  FOR ALL USING (public.is_ops(auth.uid()))
  WITH CHECK (public.is_ops(auth.uid()));

CREATE POLICY "Ops audit" ON public.audit_logs
  FOR SELECT USING (public.is_ops(auth.uid()));
CREATE POLICY "Ops audit write" ON public.audit_logs
  FOR INSERT WITH CHECK (public.is_ops(auth.uid()));

CREATE POLICY "Org members view org orders" ON public.orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organization_members m
      WHERE m.organization_id = orders.organization_id AND m.user_id = auth.uid()
    )
  );
CREATE POLICY "Org members insert org orders" ON public.orders
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members m
      WHERE m.organization_id = orders.organization_id AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "Drivers claim pending orders" ON public.orders
  FOR UPDATE
  USING (status = 'pending' AND public.has_role(auth.uid(), 'livreur'))
  WITH CHECK (driver_id = auth.uid());

CREATE POLICY "Finance manage plans" ON public.pricing_plans
  FOR ALL USING (public.is_finance_staff(auth.uid()))
  WITH CHECK (public.is_finance_staff(auth.uid()));

CREATE POLICY "Ops insert livreur or entreprise role" ON public.user_roles
  FOR INSERT WITH CHECK (
    public.is_ops(auth.uid())
    AND role IN ('livreur'::public.app_role, 'entreprise'::public.app_role)
  );
