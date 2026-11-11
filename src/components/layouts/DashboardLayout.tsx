import { Link, useLocation, useNavigate } from "react-router-dom";
import { LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { HOME_BY_ROLE, MENU_BY_ROLE, ROLE_LABEL, type AppRole } from "@/lib/roles";
import { VitaWordmark } from "@/components/brand/VitaWordmark";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  flush?: boolean;
}

const DashboardLayout = ({ children, title, flush }: DashboardLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, primaryRole, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const role: AppRole = primaryRole ?? "client";
  const menuItems = MENU_BY_ROLE[role] ?? MENU_BY_ROLE.client;
  /** Unified dark product shell for client, driver, admin and entreprise. */
  const ops = true;
  const isActive = (href: string) =>
    href === "/admin" || href === "/entreprise" || href === "/livreur" || href === "/dashboard"
      ? location.pathname === href
      : location.pathname === href || location.pathname.startsWith(`${href}/`);

  const handleLogout = async () => {
    setMobileOpen(false);
    await signOut();
    navigate("/");
  };

  const page = menuItems.find((item) => isActive(item.href));
  const pageLabel = page?.label ?? title ?? "Vita";
  const identity = user?.phone || user?.email || ROLE_LABEL[role];
  const chrome = "border-white/10 bg-[#0a0a0a]";
  const mute = "text-white/40";
  const shell = "min-h-screen bg-[#101214] text-white";

  const NavLinks = ({ onNavigate }: { onNavigate?: () => void }) => (
    <>
      {menuItems.map((item) => {
        const active = isActive(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            to={item.href}
            onClick={onNavigate}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors ${
              active
                ? "bg-primary text-primary-foreground"
                : ops
                  ? "text-white/70 hover:bg-white/10 hover:text-white"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" strokeWidth={1.8} />
            {item.label}
          </Link>
        );
      })}
    </>
  );

  return (
    <div className={shell}>
      <aside
        className={`hidden md:flex fixed inset-y-0 left-0 z-40 w-[220px] flex-col py-4 border-r ${
          ops ? "bg-[#0a0a0a] border-white/10" : "bg-card border-border"
        }`}
      >
        <Link to={HOME_BY_ROLE[role]} className="mb-6 px-4">
          <VitaWordmark lockup className="h-8" />
        </Link>

        <nav className="flex-1 flex flex-col gap-0.5 w-full px-2 overflow-y-auto">
          <NavLinks />
        </nav>

        <button
          type="button"
          onClick={handleLogout}
          className={`mx-2 mt-2 flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] ${
            ops ? "text-white/45 hover:bg-white/10 hover:text-white" : "text-muted-foreground hover:bg-secondary"
          }`}
        >
          <LogOut className="w-4 h-4" strokeWidth={1.8} />
          Sortir
        </button>
      </aside>

      <header className={`md:hidden sticky top-0 z-40 border-b ${chrome}`}>
        <div className="h-[2px] bg-primary" />
        <div className="h-14 px-3 flex items-center gap-2">
          <button
            type="button"
            aria-label="Ouvrir le menu"
            onClick={() => setMobileOpen(true)}
            className={`shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-lg border ${
              ops ? "border-white/15 text-white" : "border-border text-foreground"
            }`}
          >
            <Menu className="w-4 h-4" strokeWidth={1.8} />
          </button>
          <Link to={HOME_BY_ROLE[role]} className="shrink-0">
            <VitaWordmark lockup className="h-7" />
          </Link>
          <p className="min-w-0 flex-1 font-heading text-[15px] font-semibold tracking-tight truncate text-right">
            {pageLabel}
          </p>
        </div>
      </header>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Fermer le menu"
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
          />
          <div
            className={`absolute inset-y-0 left-0 w-[min(18rem,86vw)] flex flex-col border-r shadow-2xl ${
              ops ? "bg-[#0a0a0a] border-white/10" : "bg-card border-border"
            }`}
          >
            <div className="flex items-center justify-between px-4 h-14 border-b border-inherit">
              <VitaWordmark lockup className="h-7" />
              <button
                type="button"
                aria-label="Fermer"
                onClick={() => setMobileOpen(false)}
                className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${
                  ops ? "text-white/70 hover:bg-white/10" : "text-muted-foreground hover:bg-secondary"
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-2 py-3 flex flex-col gap-0.5">
              <NavLinks onNavigate={() => setMobileOpen(false)} />
            </nav>
            <div className={`px-4 py-3 border-t text-xs ${mute}`}>
              <p className="font-mono uppercase tracking-wider">{ROLE_LABEL[role]}</p>
              <p className="mt-1 truncate">{identity}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className={`m-3 flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] ${
                ops ? "text-white/45 hover:bg-white/10 hover:text-white" : "text-muted-foreground hover:bg-secondary"
              }`}
            >
              <LogOut className="w-4 h-4" strokeWidth={1.8} />
              Sortir
            </button>
          </div>
        </div>
      )}

      <main className="md:ml-[220px] min-h-screen pb-24 md:pb-0">
        <header className={`hidden md:flex h-16 items-center justify-between px-6 lg:px-8 border-b ${chrome}`}>
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
        <div className={flush ? "" : "p-4 lg:p-8"}>{children}</div>
      </main>

      <nav
        className={`md:hidden fixed bottom-0 inset-x-0 z-50 border-t safe-area-pb ${
          ops ? "border-white/10 bg-[#0a0a0a]/95 backdrop-blur-md" : "border-border bg-card/95 backdrop-blur-md"
        }`}
      >
        <div className="flex justify-around">
          {menuItems.slice(0, 5).map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex flex-1 flex-col items-center gap-1 px-1 py-3 text-[10px] font-medium min-w-0 ${
                  active ? "text-primary" : ops ? "text-white/55" : "text-muted-foreground"
                }`}
              >
                <Icon className="w-4 h-4" strokeWidth={active ? 2.2 : 1.7} />
                <span className="truncate max-w-full">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default DashboardLayout;
