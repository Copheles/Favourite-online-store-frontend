import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  ClipboardList,
  HandCoins,
  History,
  KeyRound,
  Package,
  PackagePlus,
  PieChart,
  Receipt,
  ShoppingCart,
  Users,
  UserCog,
  Store,
} from "lucide-react";
import type { Role } from "@/types/auth";

export interface PosModule {
  id: string;
  labelKey: string;
  path: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  bubbleColor: string;
  badge?: number;
  roles?: Role[];
}

export const posModules: PosModule[] = [
  {
    id: "sale",
    labelKey: "pos.modules.sale",
    path: "/sale",
    icon: ShoppingCart,
    iconBg: "bg-blue-50 dark:bg-blue-950/30",
    iconColor: "text-blue-600 dark:text-blue-400",
    bubbleColor: "bg-blue-400/10 dark:bg-blue-400/15",
    roles: ["owner", "admin", "staff"],
  },
  {
    id: "currentOrder",
    labelKey: "pos.modules.currentOrder",
    path: "/orders",
    icon: ClipboardList,
    iconBg: "bg-indigo-50 dark:bg-indigo-950/30",
    iconColor: "text-indigo-600 dark:text-indigo-400",
    bubbleColor: "bg-indigo-400/10 dark:bg-indigo-400/15",
    roles: ["owner", "admin", "staff", "monitor"],
  },
  {
    id: "saleReport",
    labelKey: "pos.modules.saleReport",
    path: "/reports/sale",
    icon: BarChart3,
    iconBg: "bg-emerald-50 dark:bg-emerald-950/30",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    bubbleColor: "bg-emerald-400/10 dark:bg-emerald-400/15",
    roles: ["owner", "admin", "staff", "monitor"],
  },
  {
    id: "stockList",
    labelKey: "pos.modules.stockList",
    path: "/stock",
    icon: Package,
    iconBg: "bg-orange-50 dark:bg-orange-950/30",
    iconColor: "text-orange-600 dark:text-orange-400",
    bubbleColor: "bg-orange-400/10 dark:bg-orange-400/15",
    roles: ["owner", "admin", "staff", "monitor"],
  },
  {
    id: "products",
    labelKey: "pos.modules.products",
    path: "/products",
    icon: PackagePlus,
    iconBg: "bg-amber-50 dark:bg-amber-950/30",
    iconColor: "text-amber-600 dark:text-amber-400",
    bubbleColor: "bg-amber-400/10 dark:bg-amber-400/15",
    roles: ["owner", "admin", "staff", "monitor"],
  },
  {
    id: "expenses",
    labelKey: "pos.modules.expenses",
    path: "/expenses",
    icon: Receipt,
    iconBg: "bg-rose-50 dark:bg-rose-950/30",
    iconColor: "text-rose-600 dark:text-rose-400",
    bubbleColor: "bg-rose-400/10 dark:bg-rose-400/15",
    roles: ["owner", "admin", "staff", "monitor"],
  },
  {
    id: "orderHistory",
    labelKey: "pos.modules.orderHistory",
    path: "/orders/completed",
    icon: History,
    iconBg: "bg-violet-50 dark:bg-violet-950/30",
    iconColor: "text-violet-600 dark:text-violet-400",
    bubbleColor: "bg-violet-400/10 dark:bg-violet-400/15",
    roles: ["owner", "admin", "staff", "monitor"],
  },
  {
    id: "member",
    labelKey: "pos.modules.member",
    path: "/customers",
    icon: Users,
    iconBg: "bg-cyan-50 dark:bg-cyan-950/30",
    iconColor: "text-cyan-600 dark:text-cyan-400",
    bubbleColor: "bg-cyan-400/10 dark:bg-cyan-400/15",
    roles: ["owner", "admin", "staff", "monitor"],
  },
  {
    id: "outstanding",
    labelKey: "pos.modules.outstanding",
    path: "/customers/outstanding",
    icon: HandCoins,
    iconBg: "bg-red-50 dark:bg-red-950/30",
    iconColor: "text-red-600 dark:text-red-400",
    bubbleColor: "bg-red-400/10 dark:bg-red-400/15",
    roles: ["owner", "admin", "staff", "monitor"],
  },
  {
    id: "summaryReport",
    labelKey: "pos.modules.summaryReport",
    path: "/reports/summary",
    icon: PieChart,
    iconBg: "bg-slate-100 dark:bg-slate-800/40",
    iconColor: "text-slate-600 dark:text-slate-400",
    bubbleColor: "bg-slate-400/10 dark:bg-slate-400/15",
    roles: ["owner", "admin", "staff", "monitor"],
  },
  {
    id: "ownerIntegration",
    labelKey: "pos.modules.ownerIntegration",
    path: "/owner/integration",
    icon: KeyRound,
    iconBg: "bg-teal-50 dark:bg-teal-950/30",
    iconColor: "text-teal-600 dark:text-teal-400",
    bubbleColor: "bg-teal-400/10 dark:bg-teal-400/15",
    roles: ["owner"],
  },
  {
    id: "userManagement",
    labelKey: "pos.modules.userManagement",
    path: "/users",
    icon: UserCog,
    iconBg: "bg-fuchsia-50 dark:bg-fuchsia-950/30",
    iconColor: "text-fuchsia-600 dark:text-fuchsia-400",
    bubbleColor: "bg-fuchsia-400/10 dark:bg-fuchsia-400/15",
    roles: ["super_admin"],
  },
  {
    id: "branchManagement",
    labelKey: "pos.modules.branchManagement",
    path: "/branches",
    icon: Store,
    iconBg: "bg-sky-50 dark:bg-sky-950/30",
    iconColor: "text-sky-600 dark:text-sky-400",
    bubbleColor: "bg-sky-400/10 dark:bg-sky-400/15",
    roles: ["super_admin"],
  },
];
