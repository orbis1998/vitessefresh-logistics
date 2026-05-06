GRANT USAGE ON SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_my_roles()
RETURNS TABLE(role public.app_role)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ur.role
  FROM public.user_roles ur
  WHERE ur.user_id = auth.uid()
  ORDER BY CASE ur.role
    WHEN 'admin' THEN 1
    WHEN 'livreur' THEN 2
    ELSE 3
  END;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_roles() TO authenticated;

DROP POLICY IF EXISTS "Drivers view pending orders" ON public.orders;
CREATE POLICY "Drivers view unassigned accepted orders"
ON public.orders
FOR SELECT
TO authenticated
USING (
  status = 'accepted'
  AND driver_id IS NULL
  AND public.has_role(auth.uid(), 'livreur')
);

DROP POLICY IF EXISTS "Drivers update assigned orders" ON public.orders;
CREATE POLICY "Drivers update own assigned orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (auth.uid() = driver_id)
WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "Admins assign drivers to accepted orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
