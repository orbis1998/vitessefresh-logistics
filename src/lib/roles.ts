import type { LucideIcon } from "lucide-react";
import {
  Building2,
  CreditCard,
  Headphones,
  LayoutGrid,
  MapPin,
  MessageSquare,
  Package,
  Plus,
  Settings,
  Shield,
  Smartphone,
  Truck,
  Users,
  Wallet,
  Clock,
  Home,
} from "lucide-react";
export type AppRole =
  | "client"
  | "livreur"
  | "admin"
  | "gestionnaire"
  | "call_center"
  | "suivi"
  | "support"
  | "comptable"
  | "finance"
  | "entreprise";

export const STAFF_ROLES: AppRole[] = [
  "admin",
  "gestionnaire",
  "call_center",
  "suivi",
  "support",
  "comptable",
  "finance",
];

export const ROLE_LABEL: Record<AppRole, string> = {
  admin: "Admin",
  gestionnaire: "Gestionnaire",
  call_center: "Call center",
  suivi: "Suivi",
  support: "Support",
  comptable: "Comptable",
  finance: "Finance",
  entreprise: "Entreprise",
  livreur: "Livreur",
  client: "Client",
};

export const ROLE_PRIORITY: AppRole[] = [
  "admin",
  "gestionnaire",
  "finance",
  "comptable",
  "call_center",
  "suivi",
  "support",
  "entreprise",
  "livreur",
  "client",
];

export function pickPrimaryRole(roles: AppRole[]): AppRole | null {
  return ROLE_PRIORITY.find((r) => roles.includes(r)) ?? null;
}

export function isStaff(roles: AppRole[]) {
  return roles.some((r) => STAFF_ROLES.includes(r));
}

export type NavItem = { icon: LucideIcon; label: string; href: string };

const ADMIN_MENU: NavItem[] = [
  { icon: LayoutGrid, label: "Cockpit", href: "/admin" },
  { icon: MapPin, label: "Carte", href: "/admin/carte" },
  { icon: Package, label: "Commandes", href: "/admin/commandes" },
  { icon: Clock, label: "Colis", href: "/admin/suivi" },
  { icon: Truck, label: "Livreurs", href: "/admin/livreurs" },
  { icon: Users, label: "Clients", href: "/admin/utilisateurs" },
  { icon: Building2, label: "Entreprises", href: "/admin/entreprises" },
  { icon: CreditCard, label: "Forfaits", href: "/admin/abonnements" },
  { icon: Wallet, label: "Finance", href: "/admin/finance" },
  { icon: Headphones, label: "Support", href: "/admin/support" },
  { icon: Shield, label: "Équipe", href: "/admin/equipe" },
  { icon: Smartphone, label: "WhatsApp", href: "/admin/whatsapp" },
  { icon: Settings, label: "Paramètres", href: "/admin/parametres" },
];

const byAllow = (allow: string[]) =>
  ADMIN_MENU.filter((item) => allow.includes(item.href));

export const MENU_BY_ROLE: Record<AppRole, NavItem[]> = {
  admin: ADMIN_MENU,
  gestionnaire: byAllow([
    "/admin",
    "/admin/carte",
    "/admin/commandes",
    "/admin/suivi",
    "/admin/livreurs",
    "/admin/utilisateurs",
    "/admin/entreprises",
    "/admin/parametres",
  ]),
  call_center: byAllow(["/admin", "/admin/commandes", "/admin/suivi", "/admin/support", "/admin/utilisateurs"]),
  suivi: byAllow(["/admin", "/admin/carte", "/admin/suivi", "/admin/commandes"]),
  support: byAllow(["/admin", "/admin/support", "/admin/commandes"]),
  comptable: byAllow(["/admin", "/admin/finance", "/admin/abonnements", "/admin/commandes"]),
  finance: byAllow(["/admin", "/admin/finance", "/admin/abonnements", "/admin/entreprises"]),
  entreprise: [
    { icon: LayoutGrid, label: "Tableau", href: "/entreprise" },
    { icon: Package, label: "Courses", href: "/entreprise/courses" },
    { icon: Users, label: "Équipe", href: "/entreprise/equipe" },
    { icon: CreditCard, label: "Forfait", href: "/entreprise/forfait" },
  ],
  livreur: [
    { icon: LayoutGrid, label: "Mission", href: "/livreur" },
    { icon: Package, label: "Courses", href: "/livreur/courses" },
    { icon: Truck, label: "Livraisons", href: "/livreur/livraisons" },
  ],
  client: [
    { icon: Home, label: "Accueil", href: "/dashboard" },
    { icon: Plus, label: "Commander", href: "/dashboard/order" },
    { icon: Clock, label: "Courses", href: "/dashboard/orders-list" },
    { icon: MapPin, label: "Suivi", href: "/dashboard/tracking" },
    { icon: MessageSquare, label: "Support", href: "/dashboard/support" },
  ],
};

export const HOME_BY_ROLE: Record<AppRole, string> = {
  admin: "/admin",
  gestionnaire: "/admin",
  call_center: "/admin",
  suivi: "/admin/carte",
  support: "/admin/support",
  comptable: "/admin/finance",
  finance: "/admin/finance",
  entreprise: "/entreprise",
  livreur: "/livreur",
  client: "/dashboard",
};

export const STAFF_ROLES_CREATABLE: AppRole[] = [
  "gestionnaire",
  "call_center",
  "suivi",
  "support",
  "comptable",
  "finance",
  "livreur",
  "entreprise",
];
