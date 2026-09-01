import { toMoney } from "@/lib/format";
import { getOrderCustomerId, getOrderTotals } from "@/lib/order";
import type { ExchangeOrderInput, OrderDetail } from "@/types/api";

export type ExchangeCartLine =
  | {
      kind: "original";
      key: string;
      orderItemId: string;
      productId: string;
      productName: string;
      originalQty: number;
      originalUnitPrice: number;
      originalDiscount: number;
      quantity: number;
      unitPrice: number;
      discount: number;
      removed: boolean;
    }
  | {
      kind: "new";
      key: string;
      productId: string;
      productName: string;
      quantity: number;
      unitPrice: number;
      discount: number;
    };

export type ExchangeFormSnapshot = {
  customerId: string;
  orderDiscount: number;
  deliveryFee: number;
  taxAmount: number;
  paidAmount: number;
  notes: string;
};

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function createExchangeCartFromOrder(order: OrderDetail): ExchangeCartLine[] {
  return order.items.map((item) => ({
    kind: "original" as const,
    key: item.id,
    orderItemId: item.id,
    productId: item.productId,
    productName: item.productName,
    originalQty: item.quantity,
    originalUnitPrice: toMoney(item.unitPrice),
    originalDiscount: toMoney(item.discount),
    quantity: item.quantity,
    unitPrice: toMoney(item.unitPrice),
    discount: toMoney(item.discount),
    removed: false,
  }));
}

export function buildFinalOrderItems(
  lines: ExchangeCartLine[],
): ExchangeOrderInput["items"] {
  return lines
    .filter((line) => line.kind === "new" || (!line.removed && line.quantity > 0))
    .map((line) => ({
      productId: line.productId,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      discount: line.discount,
    }));
}

export function computeOrderEditTotals(
  items: ExchangeOrderInput["items"],
  orderDiscount: number,
  deliveryFee: number,
  taxAmount: number,
) {
  const subtotal = roundMoney(
    items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
  );
  const itemDiscount = roundMoney(
    items.reduce((sum, item) => sum + (item.discount ?? 0) * item.quantity, 0),
  );
  const netTotal = roundMoney(
    Math.max(subtotal - itemDiscount - orderDiscount + deliveryFee + taxAmount, 0),
  );

  return { subtotal, itemDiscount, netTotal };
}

function serializeItems(items: ExchangeOrderInput["items"]): string {
  return JSON.stringify(
    [...items]
      .map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount ?? 0,
      }))
      .sort((a, b) =>
        `${a.productId}:${a.unitPrice}:${a.discount}`.localeCompare(
          `${b.productId}:${b.unitPrice}:${b.discount}`,
        ),
      ),
  );
}

export function hasExchangeChanges(
  order: OrderDetail,
  lines: ExchangeCartLine[],
  form: ExchangeFormSnapshot,
  paidManuallyEdited: boolean,
): boolean {
  const finalItems = buildFinalOrderItems(lines);
  const originalItems = order.items.map((item) => ({
    productId: item.productId,
    quantity: item.quantity,
    unitPrice: toMoney(item.unitPrice),
    discount: toMoney(item.discount),
  }));

  if (serializeItems(finalItems) !== serializeItems(originalItems)) {
    return true;
  }

  const totals = getOrderTotals(order);
  const customerChanged = form.customerId !== getOrderCustomerId(order);
  const settlementChanged =
    form.orderDiscount !== totals.orderDiscount ||
    form.deliveryFee !== totals.deliveryFee ||
    form.taxAmount !== totals.taxAmount;
  const notesChanged = form.notes.trim() !== (order.notes?.trim() ?? "");
  const paidChanged =
    paidManuallyEdited ||
    form.paidAmount !== toMoney(order.paidTotal ?? order.payment?.paidAmount ?? 0);

  return settlementChanged || customerChanged || notesChanged || paidChanged;
}
