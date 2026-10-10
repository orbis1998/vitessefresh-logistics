import { Link, useLocation, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { HOME_BY_ROLE, MENU_BY_ROLE, ROLE_LABEL } from "@/lib/roles";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

const DashboardLayout = ({ children, title }: DashboardLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, primaryRole, signOut } = useAuth();

  const role = primaryRole ?? "client";
  const menuItems = MENU_BY_ROLE[role] ?? MENU_BY_ROLE.client;
  const ops = role !== "entreprise";
  const isActive = (href: string) =>
    href === "/admin" || href === "/entreprise" || href === "/livreur" || href === "/dashboard"
      ? location.pathname === href
      : location.pathname === href || location.pathname.startsWith(`${href}/`);

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const page = menuItems.find((item) => isActive(item.href));
  const pageLabel = page?.label ?? title ?? "Vita";
  const identity = user?.phone || user?.email || ROLE_LABEL[role];
  const chrome = ops ? "border-white/10 bg-[#0a0a0a]" : "border-border bg-card";
  const mute = ops ? "text-white/40" : "text-muted-foreground";

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

      <header className={`lg:hidden sticky top-0 z-40 border-b ${chrome}`}>
        <div className="h-[2px] bg-primary" />
        <div className="h-14 px-4 flex items-center gap-3">
          <Link to={HOME_BY_ROLE[role]} className="flex items-center gap-2 shrink-0">
            <span className="h-4 w-[3px] bg-primary" />
            <span className="font-heading text-[15px] font-bold tracking-tight leading-none">
              Vita <span className={ops ? "text-white/90" : "text-foreground"}>Express</span>
            </span>
          </Link>
          <span className={`hidden sm:block h-4 w-px ${ops ? "bg-white/15" : "bg-border"}`} />
          <p className="min-w-0 flex-1 font-heading text-[15px] font-semibold tracking-tight truncate">
            {pageLabel}
          </p>
          <p className={`hidden sm:block shrink-0 font-mono text-[10px] tracking-[0.16em] uppercase ${mute}`}>
            {ROLE_LABEL[role]}
          </p>
          <button
            type="button"
            onClick={handleLogout}
            className={`shrink-0 inline-flex items-center gap-1.5 h-8 px-2.5 font-mono text-[10px] tracking-[0.14em] uppercase border ${
              ops
                ? "border-white/15 text-white/70 hover:text-white hover:border-white/40"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            <LogOut className="w-3.5 h-3.5" strokeWidth={1.8} />
            <span className="hidden sm:inline">Sortir</span>
          </button>
        </div>
      </header>

      <main className="lg:ml-[200px] min-h-screen pb-24 lg:pb-0">
        <header className={`hidden lg:flex h-16 items-center justify-between px-8 border-b ${chrome}`}>
          <div className="min-w-0">
            <p className={`font-mono text-[10px] tracking-[0.2em] uppercase ${mute}`}>
              {ROLE_LABEL[role]}
            </p>
            <h1 className="font-heading text-[22px] font-bold tracking-tight leading-none mt-1">
              {pageLabel}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <p className={`font-mono text-xs truncate max-w-[220px] ${mute}`}>{identity}</p>
            <button
              type="button"
              onClick={handleLogout}
              className={`inline-flex items-center gap-1.5 h-8 px-3 font-mono text-[10px] tracking-wider uppercase border ${
                ops
                  ? "border-white/15 text-white/60 hover:text-white hover:border-white/40"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <LogOut className="w-3.5 h-3.5" strokeWidth={1.8} />
              Sortir
            </button>
          </div>
        </header>
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
