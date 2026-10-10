-- Break infinite RLS recursion on public.users and stop auth sync from
-- overwriting staff roles (login UPDATE on auth.users was resetting ADMIN → CLIENT).

CREATE OR REPLACE FUNCTION public.is_staff(_uid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
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

CREATE OR REPLACE FUNCTION public.sync_public_user_from_auth()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
BEGIN
  INSERT INTO public.users (id, email, name, phone, role, avatar, verified)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
      NULLIF(NEW.raw_user_meta_data->>'fullName', ''),
      NEW.email
    ),
    NEW.raw_user_meta_data->>'phone',
    'CLIENT'::public.user_role,
    NEW.raw_user_meta_data->>'avatar',
    (NEW.email_confirmed_at IS NOT NULL)
  )
  ON CONFLICT (id) DO UPDATE
    SET email    = EXCLUDED.email,
        name     = CASE
          WHEN EXCLUDED.name IS NOT NULL AND EXCLUDED.name <> EXCLUDED.email THEN EXCLUDED.name
          ELSE public.users.name
        END,
        phone    = COALESCE(EXCLUDED.phone, public.users.phone),
        avatar   = COALESCE(EXCLUDED.avatar, public.users.avatar),
        verified = EXCLUDED.verified;
  RETURN NEW;
END;
$$;

DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Staff users" ON public.users;
DROP POLICY IF EXISTS "Users can view themselves" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Staff users" ON public.users
  FOR SELECT USING (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
