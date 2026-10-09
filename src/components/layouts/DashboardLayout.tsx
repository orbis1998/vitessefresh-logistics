import { Link, useLocation, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { HOME_BY_ROLE, MENU_BY_ROLE, ROLE_LABEL, isStaff } from "@/lib/roles";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

const DashboardLayout = ({ children, title, subtitle }: DashboardLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, primaryRole, signOut, roles } = useAuth();

  const role = primaryRole ?? "client";
  const menuItems = MENU_BY_ROLE[role] ?? MENU_BY_ROLE.client;
  const ops = isStaff(roles) || role === "livreur" || role === "entreprise";
  const isActive = (href: string) =>
    href === "/admin" || href === "/entreprise" || href === "/livreur" || href === "/dashboard"
      ? location.pathname === href
      : location.pathname === href || location.pathname.startsWith(`${href}/`);

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const initials = (user?.email ?? "U").slice(0, 1).toUpperCase();

  return (
    <div className={ops ? "min-h-screen bg-[#101214] text-white" : "theme-app min-h-screen bg-background text-foreground"}>
      <aside
        className={`hidden lg:flex fixed inset-y-0 left-0 z-40 w-[200px] flex-col py-4 border-r ${
          ops ? "bg-[#0a0a0a] border-white/10" : "bg-card border-border"
        }`}
      >
        <Link
          to={HOME_BY_ROLE[role]}
          className="mb-6 px-4 font-heading font-bold text-primary text-sm tracking-tight"
        >
          Vita <span className={ops ? "text-white" : "text-foreground"}>Express</span>
        </Link>

        <nav className="flex-1 flex flex-col gap-0.5 w-full px-2 overflow-y-auto">
          {menuItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] font-medium transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : ops
                      ? "text-white/55 hover:bg-white/10 hover:text-white"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <item.icon className="w-4 h-4 shrink-0" strokeWidth={1.8} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={handleLogout}
          className={`mx-2 mt-2 flex items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] ${
            ops ? "text-white/45 hover:bg-white/10 hover:text-white" : "text-muted-foreground hover:bg-secondary"
          }`}
        >
          <LogOut className="w-4 h-4" strokeWidth={1.8} />
          Sortir
        </button>
      </aside>

      <header
        className={`lg:hidden sticky top-0 z-40 flex h-14 items-center justify-between border-b px-4 ${
          ops ? "border-white/10 bg-[#0a0a0a]" : "border-border bg-card"
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="font-heading font-bold text-primary text-sm">VE</span>
          <div className="min-w-0">
            <p className="font-heading text-sm font-semibold leading-none">{title}</p>
            {subtitle && (
              <p className={`text-[11px] mt-0.5 ${ops ? "text-white/45" : "text-muted-foreground"}`}>{subtitle}</p>
            )}
          </div>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
          {initials}
        </div>
      </header>

      <main className="lg:ml-[200px] min-h-screen pb-24 lg:pb-0">
        {(title || subtitle) && (
          <header
            className={`hidden lg:flex h-[64px] items-center justify-between px-8 border-b ${
              ops ? "border-white/10 bg-[#0a0a0a]/80" : "border-border bg-card"
            }`}
          >
            <div>
              <h1 className="text-lg font-heading font-semibold">{title}</h1>
              {subtitle && (
                <p className={`text-sm ${ops ? "text-white/45" : "text-muted-foreground"}`}>{subtitle}</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium truncate max-w-[180px]">{user?.email}</p>
                <p className={`text-xs ${ops ? "text-white/40" : "text-muted-foreground"}`}>{ROLE_LABEL[role]}</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
                {initials}
              </div>
            </div>
          </header>
        )}
        <div className="p-4 lg:p-8">{children}</div>
      </main>

      <nav
        className={`lg:hidden fixed bottom-0 inset-x-0 z-40 border-t safe-area-pb overflow-x-auto ${
          ops ? "border-white/10 bg-[#0a0a0a]" : "border-border bg-card"
        }`}
      >
        <div className="flex min-w-max">
          {menuItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex flex-col items-center gap-1 px-3 py-3 text-[10px] font-medium min-w-[64px] ${
                  active ? "text-primary" : ops ? "text-white/45" : "text-muted-foreground"
                }`}
              >
                <item.icon className="w-4 h-4" strokeWidth={active ? 2.2 : 1.7} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default DashboardLayout;
