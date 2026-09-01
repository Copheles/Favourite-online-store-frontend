import type { OrderStatus, PaymentType, PosProduct } from "@/types/api";
import type { CartLine } from "@/lib/cart";

export type AddToCartResult = "added" | "unchanged";

export function tryAddToCart(
  lines: CartLine[],
  product: PosProduct,
): { lines: CartLine[]; result: AddToCartResult } {
  const existing = lines.find((l) => l.product.productId === product.productId);
  if (existing) {
    return {
      lines: lines.map((l) =>
        l.product.productId === product.productId
          ? { ...l, quantity: l.quantity + 1, product }
          : l,
      ),
      result: "added",
    };
  }
  return {
    lines: [...lines, { product, quantity: 1 }],
    result: "added",
  };
}

export const SALE_CLEAR_CART_EVENT = "sale:clear-cart";
export const SALE_FOCUS_BARCODE_EVENT = "sale:focus-barcode";

export function dispatchSaleClearCart() {
  window.dispatchEvent(new CustomEvent(SALE_CLEAR_CART_EVENT));
}

export function dispatchSaleFocusBarcode() {
  window.dispatchEvent(new CustomEvent(SALE_FOCUS_BARCODE_EVENT));
}

const CART_STORAGE_KEY = "pos-sale-cart-v1";

export function loadPersistedCart(): CartLine[] {
  try {
    const raw = sessionStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CartLine[];
  } catch {
    return [];
  }
}

export function persistCart(lines: CartLine[]) {
  try {
    if (lines.length === 0) {
      sessionStorage.removeItem(CART_STORAGE_KEY);
      return;
    }
    sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(lines));
  } catch {
    // ignore quota errors
  }
}

export function clearPersistedCart() {
  sessionStorage.removeItem(CART_STORAGE_KEY);
}

export interface SaleDraftCheckout {
  customerId: string;
  status?: Extract<OrderStatus, "COMPLETED" | "PROCESSING">;
  paymentType: PaymentType;
  paidAmount: number;
  orderDiscount: number;
  deliveryFee: number;
  orderDate: string;
  notes: string;
}

export interface SaleDraft {
  id: string;
  label: string;
  createdAt: number;
  lines: CartLine[];
  checkout: SaleDraftCheckout;
}

const DRAFTS_STORAGE_KEY = "pos-sale-drafts-v1";

export function loadDrafts(): SaleDraft[] {
  try {
    const raw = localStorage.getItem(DRAFTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SaleDraft[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveDrafts(drafts: SaleDraft[]) {
  try {
    if (drafts.length === 0) {
      localStorage.removeItem(DRAFTS_STORAGE_KEY);
      return;
    }
    localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(drafts));
  } catch {
    // ignore quota errors
  }
}

export function createDraftId(): string {
  return `draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const CART_LIST_RATIO_KEY = "pos-sale-cart-list-ratio-v1";
export const DEFAULT_CART_LIST_RATIO = 0.58;
export const MIN_CART_LIST_RATIO = 0.32;
export const MAX_CART_LIST_RATIO = 0.78;

export function clampCartListRatio(ratio: number): number {
  return Math.min(MAX_CART_LIST_RATIO, Math.max(MIN_CART_LIST_RATIO, ratio));
}

export function loadCartListRatio(): number {
  try {
    const raw = localStorage.getItem(CART_LIST_RATIO_KEY);
    if (!raw) return DEFAULT_CART_LIST_RATIO;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) return DEFAULT_CART_LIST_RATIO;
    return clampCartListRatio(parsed);
  } catch {
    return DEFAULT_CART_LIST_RATIO;
  }
}

export function persistCartListRatio(ratio: number) {
  try {
    localStorage.setItem(CART_LIST_RATIO_KEY, String(clampCartListRatio(ratio)));
  } catch {
    // ignore quota errors
  }
}

export const CART_WIDTH_RATIO_KEY = "pos-sale-cart-width-ratio-v1";
export const DEFAULT_CART_WIDTH_RATIO = 0.35;
export const MIN_CART_WIDTH_RATIO = 0.25;
export const MAX_CART_WIDTH_RATIO = 0.5;

export function clampCartWidthRatio(ratio: number): number {
  return Math.min(MAX_CART_WIDTH_RATIO, Math.max(MIN_CART_WIDTH_RATIO, ratio));
}

export function loadCartWidthRatio(): number {
  try {
    const raw = localStorage.getItem(CART_WIDTH_RATIO_KEY);
    if (!raw) return DEFAULT_CART_WIDTH_RATIO;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) return DEFAULT_CART_WIDTH_RATIO;
    return clampCartWidthRatio(parsed);
  } catch {
    return DEFAULT_CART_WIDTH_RATIO;
  }
}

export function persistCartWidthRatio(ratio: number) {
  try {
    localStorage.setItem(CART_WIDTH_RATIO_KEY, String(clampCartWidthRatio(ratio)));
  } catch {
    // ignore quota errors
  }
}
