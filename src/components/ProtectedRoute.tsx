import { Navigate, useLocation } from "react-router-dom";
import { useAuth, AppRole } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface Props {
  children: React.ReactNode;
  requireRole?: AppRole;
}

const ProtectedRoute = ({ children, requireRole }: Props) => {
  const { user, loading, hasRole, primaryRole } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  if (requireRole && !hasRole(requireRole)) {
    // Redirect to user's own dashboard
    const target =
      primaryRole === "admin"
        ? "/admin"
        : primaryRole === "livreur"
          ? "/livreur"
          : "/dashboard";
    return <Navigate to={target} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
