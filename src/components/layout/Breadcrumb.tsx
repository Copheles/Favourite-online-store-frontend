import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  path: string;
}

export function Breadcrumb({ className }: { className?: string }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const crumbs = buildBreadcrumbs(location.pathname, t);

  if (crumbs.length <= 1) return null;

  const current = crumbs[crumbs.length - 1];
  const parents = crumbs.slice(0, -1);

  return (
    <>
      <nav
        aria-label="Breadcrumb"
        className={cn("min-w-0 sm:hidden", className)}
      >
        <span className="block truncate text-sm font-semibold text-foreground">
          {current.label}
        </span>
      </nav>

      <nav
        aria-label="Breadcrumb"
        className={cn("hidden min-w-0 sm:flex sm:flex-1", className)}
      >
        <ol className="flex min-w-0 items-center gap-1 overflow-hidden">
          {parents.map((crumb) => (
            <li
              key={crumb.path}
              className="flex min-w-0 shrink items-center gap-1"
            >
              <button
                type="button"
                onClick={() => navigate(crumb.path)}
                className="truncate rounded-md px-1.5 py-0.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {crumb.label}
              </button>
              <ChevronRight
                aria-hidden
                className="size-3 shrink-0 text-muted-foreground/40"
              />
            </li>
          ))}
          <li className="min-w-0 truncate">
            <span
              aria-current="page"
              className="block truncate text-sm font-semibold text-foreground"
            >
              {current.label}
            </span>
          </li>
        </ol>
      </nav>
    </>
  );
}

function buildBreadcrumbs(
  pathname: string,
  t: (key: string) => string,
): BreadcrumbItem[] {
  const routeMap: Record<string, { labelKey: string; parent?: string }> = {
    "/dashboard": { labelKey: "sidebar.menu.dashboard" },
    "/sale": { labelKey: "pos.modules.sale", parent: "/dashboard" },
    "/orders": { labelKey: "sidebar.menu.orders", parent: "/dashboard" },
    "/orders/completed": {
      labelKey: "sidebar.menu.completedOrders",
      parent: "/orders",
    },
    "/stock": { labelKey: "pos.modules.stockList", parent: "/dashboard" },
    "/products": { labelKey: "pos.modules.products", parent: "/dashboard" },
    "/products/create": {
      labelKey: "pos.settings.addProduct",
      parent: "/products",
    },
    "/expenses": { labelKey: "pos.modules.expenses", parent: "/dashboard" },
    "/customers": { labelKey: "sidebar.menu.customers", parent: "/dashboard" },
    "/customers/outstanding": {
      labelKey: "sidebar.menu.outstanding",
      parent: "/customers",
    },
    "/reports/sale": {
      labelKey: "pos.modules.saleReport",
      parent: "/dashboard",
    },
    "/reports/summary": {
      labelKey: "pos.modules.summaryReport",
      parent: "/dashboard",
    },
    "/owner/integration": {
      labelKey: "pos.modules.ownerIntegration",
      parent: "/dashboard",
    },
    "/settings": { labelKey: "sidebar.menu.settings", parent: "/dashboard" },
    "/help": { labelKey: "sidebar.menu.helpCenter", parent: "/dashboard" },
    "/users": {
      labelKey: "sidebar.menu.userManagement",
      parent: "/dashboard",
    },
    "/branches": {
      labelKey: "sidebar.menu.branchManagement",
      parent: "/dashboard",
    },
  };

  const current = routeMap[pathname];
  if (!current) return [{ label: t("sidebar.menu.dashboard"), path: "/dashboard" }];

  const crumbs: BreadcrumbItem[] = [];

  if (current.parent) {
    const parent = routeMap[current.parent];
    if (parent) {
      crumbs.push({
        label: t("sidebar.menu.dashboard"),
        path: "/dashboard",
      });

      if (current.parent !== "/dashboard") {
        crumbs.push({
          label: t(parent.labelKey),
          path: current.parent,
        });
      }
    }
  } else if (pathname !== "/dashboard") {
    crumbs.push({
      label: t("sidebar.menu.dashboard"),
      path: "/dashboard",
    });
  }

  crumbs.push({ label: t(current.labelKey), path: pathname });

  return crumbs;
}
