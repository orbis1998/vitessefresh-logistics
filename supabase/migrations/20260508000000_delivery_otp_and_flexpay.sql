-- ==========================================================
-- Migration: Add delivery_otp and FlexPay columns to orders
-- ==========================================================

-- 1. Add delivery OTP and payment columns to orders table
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS delivery_otp VARCHAR(6) DEFAULT LPAD(FLOOR(RANDOM() * 9000 + 1000)::TEXT, 4, '0'),
  ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cash',
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS payment_phone TEXT,
  ADD COLUMN IF NOT EXISTS payment_reference TEXT;

-- 2. Backfill existing orders with a 4-digit OTP if null
UPDATE public.orders
SET delivery_otp = LPAD(FLOOR(RANDOM() * 9000 + 1000)::TEXT, 4, '0')
WHERE delivery_otp IS NULL;

-- 3. Backfill payment default values
UPDATE public.orders
SET payment_method = 'cash'
WHERE payment_method IS NULL;

UPDATE public.orders
SET payment_status = 'pending'
WHERE payment_status IS NULL;

-- 4. Secure RPC function to verify delivery OTP
CREATE OR REPLACE FUNCTION public.verify_delivery_otp(
  p_order_id UUID,
  p_otp TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order RECORD;
  v_driver_id UUID;
  v_clean_otp TEXT;
BEGIN
  v_clean_otp := TRIM(p_otp);

  -- Retrieve target order
  SELECT id, driver_id, status, delivery_otp, payment_method
  INTO v_order
  FROM public.orders
  WHERE id = p_order_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Commande introuvable'
    );
  END IF;

  -- Authorization check: must be assigned driver or admin
  IF v_order.driver_id != auth.uid() AND NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Vous n''êtes pas autorisé à valider cette course'
    );
  END IF;

  -- Check if already delivered
  IF v_order.status = 'delivered' THEN
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Commande déjà livrée'
    );
  END IF;

  -- OTP verification
  IF v_order.delivery_otp IS NOT NULL AND v_order.delivery_otp != v_clean_otp THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Code OTP incorrect. Demandez le code secret au destinataire.'
    );
  END IF;

  -- Mark order as delivered
  UPDATE public.orders
  SET
    status = 'delivered',
    delivered_at = NOW(),
    updated_at = NOW(),
    payment_status = CASE
      WHEN payment_method = 'cash' THEN 'paid'
      ELSE payment_status
    END
  WHERE id = p_order_id;

  -- Set driver status back to available and increment delivery count
  IF v_order.driver_id IS NOT NULL THEN
    UPDATE public.driver_profiles
    SET
      status = 'available',
      total_deliveries = total_deliveries + 1,
      updated_at = NOW()
    WHERE user_id = v_order.driver_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Livraison validée avec succès'
  );
END;
$$;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION public.verify_delivery_otp(UUID, TEXT) TO authenticated;
