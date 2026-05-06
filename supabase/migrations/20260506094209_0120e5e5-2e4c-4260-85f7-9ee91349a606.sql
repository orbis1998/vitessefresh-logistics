DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;

CREATE OR REPLACE FUNCTION public.get_my_roles()
RETURNS TABLE(role public.app_role)
LANGUAGE sql
STABLE
SECURITY INVOKER
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