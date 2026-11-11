import { useCallback, useState, type FocusEvent, type MouseEvent } from "react";
import { PanelLeftClose, PanelLeftOpen, ShieldCheck, Sprout, type LucideIcon } from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { getUser, hasSection, isSuper, logout } from "../auth";
import { SECTIONS } from "../sections";

const SIDEBAR_STORAGE_KEY = "ja_admin_sidebar_collapsed";

type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
};

type FloatingTooltip = {
  label: string;
  top: number;
  left: number;
};

// Owner-only links (super admin).
const superLinks: NavItem[] = [
  { to: "/admins", label: "Team & Access", icon: ShieldCheck },
];

function readCollapsedPref(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export default function Layout() {
  const nav = useNavigate();
  const user = getUser();
  const [collapsed, setCollapsed] = useState<boolean>(readCollapsedPref);
  const [tooltip, setTooltip] = useState<FloatingTooltip | null>(null);

  const navItems: NavItem[] = [
    ...SECTIONS.filter((s) => hasSection(s.key)).map((s) => ({
      to: s.path,
      label: s.label,
      icon: s.icon,
      end: s.end,
    })),
    ...(isSuper() ? superLinks : []),
  ];

  const showTooltip = useCallback((label: string, target: HTMLElement) => {
    const rect = target.getBoundingClientRect();
    setTooltip({
      label,
      top: rect.top + rect.height / 2,
      left: rect.right + 12,
    });
  }, []);

  const hideTooltip = useCallback(() => {
    setTooltip(null);
  }, []);

  const handleNavEnter = useCallback(
    (label: string) => (e: MouseEvent<HTMLElement> | FocusEvent<HTMLElement>) => {
      if (!collapsed) return;
      showTooltip(label, e.currentTarget);
    },
    [collapsed, showTooltip],
  );

  const toggleSidebar = useCallback(() => {
    setTooltip(null);
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, next ? "1" : "0");
      } catch {
        // Ignore storage errors in restricted browsing contexts.
      }
      return next;
    });
  }, []);

  return (
    <div className="shell">
      <aside
        className={`sidebar${collapsed ? " is-collapsed" : ""}`}
        aria-label="Admin navigation"
      >
        <div className="sidebar-head">
          <div
            className="brand"
            onMouseEnter={(e) =>
              collapsed && showTooltip("Jharna Aquarium & Nursery", e.currentTarget)
            }
            onMouseLeave={hideTooltip}
          >
            <span className="brand-icon">
              <img src="/jharna-logo.png" alt="Jharna Aquarium & Nursery" />
            </span>
            <span className="brand-text">
              Jharna<span>Aquarium</span>
            </span>
          </div>

          <button
            type="button"
            className="sidebar-toggle"
            onClick={toggleSidebar}
            onMouseEnter={(e) =>
              showTooltip(collapsed ? "Expand sidebar" : "Collapse sidebar", e.currentTarget)
            }
            onMouseLeave={hideTooltip}
            onFocus={(e) =>
              showTooltip(collapsed ? "Expand sidebar" : "Collapse sidebar", e.currentTarget)
            }
            onBlur={hideTooltip}
            aria-expanded={!collapsed}
            aria-controls="admin-sidebar-nav"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <span className="sidebar-toggle-icon" aria-hidden="true">
              {collapsed ? (
                <PanelLeftOpen size={16} strokeWidth={2.1} />
              ) : (
                <PanelLeftClose size={16} strokeWidth={2.1} />
              )}
            </span>
          </button>
        </div>

        <nav id="admin-sidebar-nav" className="nav" onScroll={hideTooltip}>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                aria-label={item.label}
                onMouseEnter={handleNavEnter(item.label)}
                onMouseLeave={hideTooltip}
                onFocus={handleNavEnter(item.label)}
                onBlur={hideTooltip}
              >
                <span className="nav-icon">
                  <Icon size={18} strokeWidth={1.9} aria-hidden="true" />
                </span>
                <span className="nav-label">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div
          className="sidebar-footer"
          onMouseEnter={(e) =>
            collapsed && showTooltip("Jharna Aquarium & Nursery Admin v1.0", e.currentTarget)
          }
          onMouseLeave={hideTooltip}
        >
          <span className="sidebar-footer-icon">
            <Sprout size={15} strokeWidth={2} aria-hidden="true" />
          </span>
          <span className="sidebar-footer-text">
            Jharna Aquarium &amp; Nursery v1.0
          </span>
        </div>

        {tooltip && (
          <div
            className="sidebar-tooltip"
            role="tooltip"
            style={{ top: tooltip.top, left: tooltip.left }}
          >
            {tooltip.label}
          </div>
        )}
      </aside>
      <div className="main">
        <div className="topbar">
          <div />
          <div className="flex">
            <span className="muted" style={{ fontSize: "13px" }}>{user?.email}</span>
            <button
              className="logout"
              onClick={() => {
                logout();
                nav("/login");
              }}
            >
              Log out
            </button>
          </div>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
