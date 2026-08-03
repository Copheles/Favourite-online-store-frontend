import { useState, useCallback, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import {
  sidebarMenuSections,
  ArrowDown01Icon,
  ArrowUp01Icon,
} from "@/constants/sidebar";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const { user } = useAuth();
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [userToggled, setUserToggled] = useState<Set<string>>(new Set());

  const toggleExpand = useCallback((path: string) => {
    setUserToggled((prev) => new Set(prev).add(path));
    setExpandedItems((prev) => ({
      ...prev,
      [path]: !prev[path],
    }));
  }, []);

  const isChildActive = useCallback(
    (children?: { path: string }[]) => {
      return children?.some((child) => location.pathname === child.path) ?? false;
    },
    [location.pathname]
  );

  // Auto-expand parents when their child route becomes active
  // (unless the user has manually toggled that parent)
  useEffect(() => {
    setExpandedItems((prev) => {
      const next = { ...prev };
      let changed = false;
      sidebarMenuSections.forEach((section) => {
        section.items.forEach((item) => {
          if (item.children && !userToggled.has(item.path)) {
            const childActive = item.children.some(
              (child) => location.pathname === child.path
            );
            if (childActive && next[item.path] !== true) {
              next[item.path] = true;
              changed = true;
            }
          }
        });
      });
      return changed ? next : prev;
    });
  }, [location.pathname, userToggled]);

  const filteredSections = sidebarMenuSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        const role = user?.role ?? "staff";
        if (item.roles?.includes("super_admin")) {
          return role === "super_admin";
        }
        return !item.roles || item.roles.includes(role);
      }),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-full w-64 flex-col border-r border-border bg-background transition-transform duration-300 ease-in-out lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center border-b border-border px-6">
          <img
            src="/favourite-myanmar-logo.png"
            alt="Favourite Myanmar Co.,Ltd."
            className="h-8 w-auto object-contain"
          />
        </div>

        {/* Menu */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {filteredSections.map((section) => (
            <div key={section.titleKey} className="mb-6">
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {t(section.titleKey)}
              </p>
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = location.pathname === item.path;
                  const hasChildren = item.children && item.children.length > 0;
                  const isExpanded = expandedItems[item.path] ?? false;
                  const isParentOfActive = isChildActive(item.children);

                  return (
                    <li key={item.path}>
                      {hasChildren ? (
                        <div>
                          {/* Parent item with children */}
                          <button
                            onClick={() => toggleExpand(item.path)}
                            className={cn(
                              "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                              isActive || isParentOfActive
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <HugeiconsIcon
                                icon={item.icon}
                                size={18}
                                strokeWidth={1.5}
                                className={cn(
                                  isActive || isParentOfActive
                                    ? "text-primary-foreground"
                                    : "text-muted-foreground"
                                )}
                              />
                              <span>{t(item.labelKey)}</span>
                            </div>
                            <HugeiconsIcon
                              icon={isExpanded ? ArrowUp01Icon : ArrowDown01Icon}
                              size={14}
                              strokeWidth={1.5}
                              className={cn(
                                "transition-transform duration-200",
                                isActive || isParentOfActive
                                  ? "text-primary-foreground/80"
                                  : "text-muted-foreground"
                              )}
                            />
                          </button>

                          {/* Children */}
                          {isExpanded && (
                            <ul className="mt-0.5 space-y-0.5 pl-[42px]">
                              {item.children!.map((child) => {
                                const isChildActiveItem = location.pathname === child.path;
                                return (
                                  <li key={child.path}>
                                    <NavLink
                                      to={child.path}
                                      onClick={onClose}
                                      className={cn(
                                        "block rounded-lg px-3 py-2 text-sm transition-all duration-200",
                                        isChildActiveItem
                                          ? "font-medium text-primary"
                                          : "text-muted-foreground hover:text-foreground"
                                      )}
                                    >
                                      {t(child.labelKey)}
                                    </NavLink>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </div>
                      ) : (
                        /* Simple item without children */
                        <NavLink
                          to={item.path}
                          onClick={onClose}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                            isActive
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          )}
                        >
                          <HugeiconsIcon
                            icon={item.icon}
                            size={18}
                            strokeWidth={1.5}
                            className={cn(
                              isActive ? "text-primary-foreground" : "text-muted-foreground"
                            )}
                          />
                          {t(item.labelKey)}
                        </NavLink>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-border px-6 py-4">
          <p className="text-[11px] text-muted-foreground">
            &copy; 2026 M2M Delivery
          </p>
          <p className="mt-0.5 text-[10px] text-muted-foreground/60">
            All rights reserved
          </p>
        </div>
      </aside>
    </>
  );
}
