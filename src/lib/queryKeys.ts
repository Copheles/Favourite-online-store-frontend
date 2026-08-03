import type { ListCustomersParams } from "@/apis/customer.api";
import type { ListExpensesParams } from "@/apis/expense.api";
import type { ListOrdersParams } from "@/apis/order.api";
import type { ListPosProductsParams } from "@/apis/pos.api";
import type { ListProductsParams } from "@/apis/product.api";
import type {
  CashSummaryParams,
  InventoryBalanceParams,
  SalesReportParams,
} from "@/apis/report.api";
import type { ListStockMovementsParams } from "@/apis/stockMovement.api";

export const queryKeys = {
  auth: {
    all: ["auth"] as const,
    me: () => [...queryKeys.auth.all, "me"] as const,
  },
  pos: {
    all: ["pos-products"] as const,
    list: (params: ListPosProductsParams) =>
      [...queryKeys.pos.all, "list", params] as const,
  },
  orders: {
    all: ["orders"] as const,
    list: (params: ListOrdersParams) =>
      [...queryKeys.orders.all, "list", params] as const,
    detail: (id: string) => [...queryKeys.orders.all, "detail", id] as const,
    receipt: (id: string) =>
      [...queryKeys.orders.all, "receipt", id] as const,
    futureCount: (branchId: string | null | undefined) =>
      [...queryKeys.orders.all, "future-count", branchId] as const,
  },
  customers: {
    all: ["customers"] as const,
    list: (params: ListCustomersParams) =>
      [...queryKeys.customers.all, "list", params] as const,
    detail: (id: string) => [...queryKeys.customers.all, "detail", id] as const,
    outstanding: (params: object) =>
      [...queryKeys.customers.all, "outstanding", params] as const,
  },
  stock: {
    all: ["inventory-balance"] as const,
    balance: (params: InventoryBalanceParams) =>
      [...queryKeys.stock.all, params] as const,
    movements: (params: ListStockMovementsParams) =>
      ["stock-movements", params] as const,
  },
  reports: {
    all: ["reports"] as const,
    sales: (params: SalesReportParams) =>
      [...queryKeys.reports.all, "sales", params] as const,
    cashSummary: (params: CashSummaryParams) =>
      [...queryKeys.reports.all, "cash-summary", params] as const,
  },
  products: {
    all: ["products"] as const,
    list: (params: ListProductsParams) =>
      [...queryKeys.products.all, "list", params] as const,
    detail: (id: string) => [...queryKeys.products.all, "detail", id] as const,
  },
  categories: {
    all: ["categories"] as const,
    list: (type?: "TOP" | "SUB") =>
      [...queryKeys.categories.all, type ?? "all"] as const,
  },
  expenses: {
    all: ["expenses"] as const,
    list: (params: ListExpensesParams) =>
      [...queryKeys.expenses.all, "list", params] as const,
  },
  settings: {
    all: ["settings"] as const,
    store: () => [...queryKeys.settings.all, "store"] as const,
  },
  managedUsers: {
    all: ["super-admin", "users"] as const,
    list: () => [...queryKeys.managedUsers.all, "list"] as const,
    detail: (userId: string) =>
      [...queryKeys.managedUsers.all, userId] as const,
    sessions: (userId: string) =>
      [...queryKeys.managedUsers.all, userId, "sessions"] as const,
  },
  managedBranches: {
    all: ["super-admin", "branches"] as const,
    list: () => [...queryKeys.managedBranches.all, "list"] as const,
  },
  branches: {
    accessible: () => ["branches", "accessible"] as const,
  },
} as const;
