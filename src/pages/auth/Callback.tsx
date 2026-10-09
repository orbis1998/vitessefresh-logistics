import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fetchMyRoles, getPostAuthPath } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";

const Callback = () => {
  const navigate = useNavigate();
  const { refreshRoles } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get("error_description") || params.get("error");
    if (error) {
      navigate("/auth/login", { replace: true });
      return;
    }

    let cancelled = false;

    const finish = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth/login", { replace: true });
        return;
      }
      const roles = await fetchMyRoles();
      await refreshRoles();
      if (!cancelled) navigate(getPostAuthPath(roles), { replace: true });
    };

    finish();
    return () => {
      cancelled = true;
    };
  }, [navigate, refreshRoles]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 pt-24">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </main>
    </div>
  );
};

export default Callback;
