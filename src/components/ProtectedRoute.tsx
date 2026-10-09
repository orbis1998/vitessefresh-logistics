import { Navigate, useLocation } from "react-router-dom";
import { useAuth, AppRole } from "@/hooks/useAuth";
import { HOME_BY_ROLE, isStaff } from "@/lib/roles";
import { Loader2 } from "lucide-react";

interface Props {
  children: React.ReactNode;
  requireRole?: AppRole | AppRole[];
  requireStaff?: boolean;
}

const ProtectedRoute = ({ children, requireRole, requireStaff }: Props) => {
  const { user, loading, hasRole, primaryRole, roles } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#101214]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  const allowed = requireRole
    ? (Array.isArray(requireRole) ? requireRole : [requireRole]).some((r) => hasRole(r))
    : true;
  const staffOk = requireStaff ? isStaff(roles) : true;

  if ((requireRole && !allowed) || (requireStaff && !staffOk)) {
    return <Navigate to={HOME_BY_ROLE[primaryRole ?? "client"]} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
