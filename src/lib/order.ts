import { toMoney } from "@/lib/format";

export function getOrderNetTotal(order: {
  totals?: { netTotal: unknown };
  netTotal?: unknown;
}): number {
  return toMoney(order.totals?.netTotal ?? order.netTotal ?? 0);
}

export interface NormalizedOrderTotals {
  subtotal: number;
  itemDiscount: number;
  orderDiscount: number;
  deliveryFee: number;
  taxAmount: number;
  netTotal: number;
}

export function getOrderTotals(order: {
  totals?: Partial<NormalizedOrderTotals>;
  subtotal?: unknown;
  itemDiscount?: unknown;
  orderDiscount?: unknown;
  deliveryFee?: unknown;
  taxAmount?: unknown;
  netTotal?: unknown;
}): NormalizedOrderTotals {
  const totals = order.totals;
  return {
    subtotal: toMoney(totals?.subtotal ?? order.subtotal ?? 0),
    itemDiscount: toMoney(totals?.itemDiscount ?? order.itemDiscount ?? 0),
    orderDiscount: toMoney(totals?.orderDiscount ?? order.orderDiscount ?? 0),
    deliveryFee: toMoney(totals?.deliveryFee ?? order.deliveryFee ?? 0),
    taxAmount: toMoney(totals?.taxAmount ?? order.taxAmount ?? 0),
    netTotal: toMoney(totals?.netTotal ?? order.netTotal ?? 0),
  };
}

export function getOrderCustomerId(order: {
  customerId?: string | null;
  customer?: { id: string | null } | null;
}): string {
  const id = order.customerId ?? order.customer?.id;
  return id && id.length > 0 ? id : "";
}

export function getOrderCashierName(
  cashier?: { username: string; displayName?: string | null } | string | null,
): string {
  if (!cashier) return "-";
  if (typeof cashier === "string") return cashier;
  const displayName = cashier.displayName?.trim();
  if (displayName) return displayName;
  return cashier.username;
}

export function getOrderDate(order: {
  date?: string;
  orderDate?: string;
  createdAt?: string;
}): string {
  return order.orderDate ?? order.date ?? order.createdAt ?? "";
}
