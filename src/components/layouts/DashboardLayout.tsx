import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Package,
  Home,
  Plus,
  Clock,
  MapPin,
  CreditCard,
  User,
  LogOut,
  Menu,
  X,
  Truck,
  Users,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth, AppRole } from "@/hooks/useAuth";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

const menuByRole: Record<AppRole, { icon: any; label: string; href: string }[]> = {
  client: [
    { icon: Home, label: "Tableau de bord", href: "/dashboard" },
    { icon: Plus, label: "Nouvelle commande", href: "/dashboard/order" },
    { icon: Clock, label: "Mes commandes", href: "/dashboard/orders" },
    { icon: MapPin, label: "Suivi en direct", href: "/dashboard/tracking" },
    { icon: CreditCard, label: "Forfaits", href: "/dashboard/plans" },
  ],
  livreur: [
    { icon: Home, label: "Tableau de bord", href: "/livreur" },
    { icon: Package, label: "Courses disponibles", href: "/livreur/courses" },
    { icon: Truck, label: "Mes livraisons", href: "/livreur/livraisons" },
  ],
  admin: [
    { icon: Shield, label: "Vue globale", href: "/admin" },
    { icon: Users, label: "Utilisateurs", href: "/admin/utilisateurs" },
    { icon: Truck, label: "Livreurs", href: "/admin/livreurs" },
    { icon: Package, label: "Commandes", href: "/admin/commandes" },
  ],
};

const DashboardLayout = ({ children, title, subtitle }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, primaryRole, signOut } = useAuth();

  const role = primaryRole ?? "client";
  const menuItems = menuByRole[role];
  const isActive = (href: string) => location.pathname === href;

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const roleLabel =
    role === "admin" ? "Administrateur" : role === "livreur" ? "Livreur" : "Client";

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-background border-b border-border h-16 flex items-center px-4">
        <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-muted rounded-lg">
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2 ml-4">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Package className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-poppins font-bold">VitesseFresh</span>
        </div>
      </header>

      {sidebarOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="lg:hidden fixed inset-0 z-40 bg-foreground/50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-full w-72 bg-background border-r border-border transform transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="h-16 lg:h-20 flex items-center justify-between px-6 border-b border-border">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-yellow">
                <Package className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-poppins font-bold text-xl">
                Vitesse<span className="text-primary">Fresh</span>
              </span>
            </Link>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 hover:bg-muted rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive(item.href)
                    ? "bg-primary text-primary-foreground shadow-yellow"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{user?.email}</p>
                <p className="text-xs text-muted-foreground">{roleLabel}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>
      </aside>

      <main className="lg:ml-72 pt-16 lg:pt-0 min-h-screen">
        {(title || subtitle) && (
          <header className="hidden lg:flex h-20 items-center justify-between px-8 border-b border-border bg-background">
            <div>
              <h1 className="text-xl font-poppins font-semibold">{title}</h1>
              {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
            </div>
          </header>
        )}
        <div className="p-4 lg:p-8">{children}</div>
      </main>
    </div>
  );
};

export default DashboardLayout;
