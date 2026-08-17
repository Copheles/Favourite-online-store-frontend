import type { DisplayStockStatus, OrderStatus, PaymentType, StockStatus } from "@/types/api";

export type StockStatusFilter = "ALL" | StockStatus;

export const STOCK_STATUS_FILTERS: StockStatusFilter[] = [
  "ALL",
  "IN_STOCK",
  "LOW_STOCK",
  "OUT_OF_STOCK",
];

export type ContactFilter = "ALL" | "WITH_PHONE" | "NO_PHONE";

export const CONTACT_FILTERS: ContactFilter[] = [
  "ALL",
  "WITH_PHONE",
  "NO_PHONE",
];

export type PaymentFilter = "ALL" | PaymentType;

export const PAYMENT_FILTERS: PaymentFilter[] = [
  "ALL",
  "CASH",
  "KBZPAY",
  "WAVEPAY",
  "CARD",
  "BANKING",
];

export function stockStatusToApi(
  value: StockStatusFilter,
): StockStatus | undefined {
  return value === "ALL" ? undefined : value;
}

export function contactFilterToApi(
  value: ContactFilter,
): "WITH_PHONE" | "NO_PHONE" | undefined {
  return value === "ALL" ? undefined : value;
}

export function paymentFilterToApi(
  value: PaymentFilter,
): PaymentType | undefined {
  return value === "ALL" ? undefined : value;
}

export type OrderStatusFilter = "ALL" | OrderStatus;

export const ORDER_STATUS_FILTERS: OrderStatusFilter[] = [
  "ALL",
  "PROCESSING",
  "COMPLETED",
  "CANCELLED",
];

export function orderStatusFilterToApi(
  value: OrderStatusFilter,
): OrderStatus | undefined {
  return value === "ALL" ? undefined : value;
}

export function getStockStatusFromQty(stockQty: number): DisplayStockStatus {
  if (stockQty < 0) return "NEGATIVE_STOCK";
  if (stockQty <= 0) return "OUT_OF_STOCK";
  if (stockQty <= 5) return "LOW_STOCK";
  return "IN_STOCK";
}

export type MovementTypeFilter = "ALL" | "IN" | "OUT" | "OUT_RETURN" | "REPACK";

export const MOVEMENT_TYPE_FILTERS: MovementTypeFilter[] = [
  "ALL",
  "IN",
  "OUT",
  "OUT_RETURN",
  "REPACK",
];
