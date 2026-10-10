-- OTP destinataire à la récupération (PICKED_UP), suivi public par n° de colis,
-- défis d'auth téléphone. Pas d'OTP au ramassage ni à la création.

DROP TRIGGER IF EXISTS trg_orders_otp_whatsapp ON public.orders;

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS otp_sent_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS public.phone_auth_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS phone_auth_challenges_phone_idx
  ON public.phone_auth_challenges (phone, created_at DESC);
ALTER TABLE public.phone_auth_challenges ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.issue_otp_on_pickup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  code text;
  phone text;
BEGIN
  IF TG_OP = 'UPDATE'
     AND NEW.status = 'PICKED_UP'::public.order_status
     AND OLD.status IS DISTINCT FROM NEW.status THEN
    NEW.picked_up_at := COALESCE(NEW.picked_up_at, now());
    IF NEW.otp_hash IS NULL THEN
      code := lpad((floor(random() * 900000) + 100000)::int::text, 6, '0');
      phone := regexp_replace(COALESCE(NEW.recipient_phone, ''), '\D', '', 'g');
      NEW.otp_hash := encode(digest(code, 'sha256'), 'hex');
      NEW.otp_expires_at := now() + interval '6 hours';
      NEW.otp_attempts := 0;
      NEW.otp_sent_at := now();
      IF length(phone) >= 9 THEN
        BEGIN
          PERFORM public.enqueue_notification(
            'otp-' || NEW.id::text || '-' || floor(extract(epoch from now()))::text,
            phone,
            'Vita Express : colis ' || COALESCE(NEW.order_number, NEW.id::text)
              || ' récupéré. Votre code de remise est '
              || code
              || '. Donnez-le uniquement au livreur à l''arrivée. Ne le partagez pas.',
            NEW.id,
            'whatsapp'
          );
        EXCEPTION WHEN OTHERS THEN
          NULL;
        END;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_issue_otp_on_pickup ON public.orders;
CREATE TRIGGER trg_issue_otp_on_pickup
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.issue_otp_on_pickup();

CREATE OR REPLACE FUNCTION public.notify_client_tracking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  phone text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    phone := regexp_replace(COALESCE(NEW.sender_phone, ''), '\D', '', 'g');
    IF length(phone) >= 9 AND NEW.order_number IS NOT NULL THEN
      BEGIN
        PERFORM public.enqueue_notification(
          'track-' || NEW.id::text,
          phone,
          'Vita Express : votre course '
            || NEW.order_number
            || ' est enregistrée. Suivi : dites ce numéro à Vita ou ouvrez /tracking.',
          NEW.id,
          'whatsapp'
        );
      EXCEPTION WHEN OTHERS THEN
        NULL;
      END;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_client_tracking ON public.orders;
CREATE TRIGGER trg_notify_client_tracking
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_client_tracking();

CREATE OR REPLACE FUNCTION public.track_parcel(p_code text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  o public.orders%ROWTYPE;
  code text := upper(btrim(COALESCE(p_code, '')));
BEGIN
  IF code = '' THEN
    RETURN jsonb_build_object('error', 'Numéro requis');
  END IF;
  SELECT * INTO o FROM public.orders
  WHERE order_number = code OR id::text = lower(btrim(p_code))
  LIMIT 1;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Colis introuvable');
  END IF;
  RETURN jsonb_build_object(
    'order_number', o.order_number,
    'status', o.status,
    'pickup_address', o.pickup_address,
    'delivery_address', o.delivery_address,
    'pickup_lat', o.pickup_lat,
    'pickup_lng', o.pickup_lng,
    'delivery_lat', o.delivery_lat,
    'delivery_lng', o.delivery_lng,
    'created_at', o.created_at,
    'picked_up_at', o.picked_up_at,
    'delivered_at', o.delivered_at
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.track_parcel(text) TO anon;
GRANT EXECUTE ON FUNCTION public.track_parcel(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.track_parcel(text) TO service_role;
