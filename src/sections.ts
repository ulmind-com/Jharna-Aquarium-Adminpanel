import type { LucideIcon } from "lucide-react";
import {
  Bell,
  FolderTree,
  Gift,
  LayoutDashboard,
  LayoutTemplate,
  Layers,
  Leaf,
  MapPin,
  Megaphone,
  MessageSquare,
  Package,
  Palette,
  PenLine,
  Settings,
  Sprout,
  Star,
  Tag,
  TrendingUp,
  Users,
} from "lucide-react";

// The single source of truth for the left-nav sections. Used by the sidebar,
// the route guards, and the per-admin access checkboxes so they never drift.
export type Section = { key: string; label: string; path: string; end?: boolean; icon: LucideIcon };

export const SECTIONS: Section[] = [
  { key: "dashboard",     label: "Dashboard",           path: "/",              end: true,  icon: LayoutDashboard },
  { key: "analytics",     label: "Analytics & Reports",  path: "/analytics",                icon: TrendingUp },
  { key: "products",      label: "Plant Inventory",      path: "/products",                 icon: Leaf },
  { key: "categories",    label: "Categories",           path: "/categories",               icon: FolderTree },
  { key: "waitlist",      label: "Restock Alerts",       path: "/waitlist",                 icon: Bell },
  { key: "combos",        label: "Plant Bundles",        path: "/combos",                   icon: Gift },
  { key: "orders",        label: "Customer Orders",      path: "/orders",                   icon: Package },
  { key: "users",         label: "Customers",            path: "/users",                    icon: Users },
  { key: "support",       label: "Support Inbox",        path: "/support",                  icon: MessageSquare },
  { key: "reviews",       label: "Plant Reviews",        path: "/reviews",                  icon: Star },
  { key: "coupons",       label: "Discount Codes",       path: "/coupons",                  icon: Tag },
  { key: "page-builder",  label: "Home Page Builder",    path: "/page-builder",             icon: LayoutTemplate },
  { key: "home-layout",   label: "Storefront Layout",    path: "/home-layout",              icon: Palette },
  { key: "home-bands",    label: "Home Bands",           path: "/home-bands",               icon: Layers },
  { key: "garden-services", label: "Garden Services",      path: "/garden-services",          icon: Sprout },
  { key: "stores",        label: "Store Locations",      path: "/stores",                   icon: MapPin },
  { key: "blog",          label: "Plant Care Blog",      path: "/blog",                     icon: PenLine },
  { key: "settings",      label: "Store Settings",       path: "/settings",                 icon: Settings },
  { key: "announcements", label: "Marquee Banner",       path: "/announcements",            icon: Megaphone },
];

export const ALL_SECTION_KEYS = SECTIONS.map((s) => s.key);
