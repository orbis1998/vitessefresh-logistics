-- Client inserts omitted Vita NOT NULL columns (zones / contacts).
-- Keep the columns, allow a first insert, and fill sensible defaults in-trigger.

ALTER TABLE public.orders ALTER COLUMN pickup_zone_id DROP NOT NULL;
ALTER TABLE public.orders ALTER COLUMN delivery_zone_id DROP NOT NULL;
ALTER TABLE public.orders ALTER COLUMN pickup_contact DROP NOT NULL;
ALTER TABLE public.orders ALTER COLUMN delivery_contact DROP NOT NULL;

CREATE OR REPLACE FUNCTION public.fill_order_required()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  fallback uuid;
  matched uuid;
BEGIN
  IF NEW.pickup_contact IS NULL OR btrim(NEW.pickup_contact) = '' THEN
    NEW.pickup_contact := COALESCE(
      NULLIF(btrim(NEW.sender_phone), ''),
      NULLIF(btrim(NEW.sender_name), ''),
      NULLIF(btrim(NEW.pickup_address), ''),
      'client'
    );
  END IF;

  IF NEW.delivery_contact IS NULL OR btrim(NEW.delivery_contact) = '' THEN
    NEW.delivery_contact := COALESCE(
      NULLIF(btrim(NEW.recipient_phone), ''),
      NULLIF(btrim(NEW.recipient_name), ''),
      NULLIF(btrim(NEW.delivery_address), ''),
      'destinataire'
    );
  END IF;

  SELECT id INTO fallback FROM public.zones WHERE COALESCE(active, true) = true LIMIT 1;

  IF NEW.pickup_zone_id IS NULL THEN
    SELECT id INTO matched FROM public.zones
    WHERE COALESCE(active, true) = true
      AND (
        NEW.pickup_address ILIKE '%' || name || '%'
        OR (commune IS NOT NULL AND NEW.pickup_address ILIKE '%' || commune || '%')
      )
    LIMIT 1;
    NEW.pickup_zone_id := COALESCE(matched, fallback);
  END IF;

  IF NEW.delivery_zone_id IS NULL THEN
    SELECT id INTO matched FROM public.zones
    WHERE COALESCE(active, true) = true
      AND (
        NEW.delivery_address ILIKE '%' || name || '%'
        OR (commune IS NOT NULL AND NEW.delivery_address ILIKE '%' || commune || '%')
      )
    LIMIT 1;
    NEW.delivery_zone_id := COALESCE(matched, fallback);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS fill_order_required ON public.orders;
CREATE TRIGGER fill_order_required
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.fill_order_required();
