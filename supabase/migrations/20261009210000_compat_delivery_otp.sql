-- Compatibilité : d’anciens clients PostgREST demandent encore delivery_otp.
-- On n’y écrit plus le code (otp_hash reste la source de vérité).
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_otp TEXT;
NOTIFY pgrst, 'reload schema';
