-- Vita staff (users.role) can list livreurs for dispatch; legacy policies used user_roles / has_role only.
-- A profile is created before the admin records licence/vehicle details.

ALTER TABLE public.driver_profiles ALTER COLUMN license_number DROP NOT NULL;
ALTER TABLE public.driver_profiles ALTER COLUMN vehicle_type DROP NOT NULL;
ALTER TABLE public.driver_profiles ALTER COLUMN vehicle_plate DROP NOT NULL;
ALTER TABLE public.driver_profiles ALTER COLUMN available SET DEFAULT false;
UPDATE public.driver_profiles SET available = false WHERE available IS NULL;
ALTER TABLE public.driver_profiles ALTER COLUMN available SET NOT NULL;

DROP POLICY IF EXISTS "Staff view driver profiles" ON public.driver_profiles;
CREATE POLICY "Staff view driver profiles" ON public.driver_profiles
  FOR SELECT USING (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Staff manage driver profiles" ON public.driver_profiles;
CREATE POLICY "Staff manage driver profiles" ON public.driver_profiles
  FOR ALL USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));
