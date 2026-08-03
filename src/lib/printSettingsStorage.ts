const RECEIPT_PAPER_KEY = "pos-receipt-paper-v1";

export const RECEIPT_PAPER_LIMITS = {
  minWidthMm: 30,
  maxWidthMm: 120,
} as const;

export const A4_WIDTH_MM = 210;
export const FALLBACK_PAPER_WIDTH_MM = 58;

export type ReceiptPaperSetting =
  | { kind: "shopDefault" }
  | { kind: "thermal"; widthMm: number }
  | { kind: "a4" };

export const DEFAULT_RECEIPT_PAPER_SETTING: ReceiptPaperSetting = {
  kind: "shopDefault",
};

export function clampThermalWidthMm(value: number): number {
  return Math.min(
    Math.max(Math.round(value), RECEIPT_PAPER_LIMITS.minWidthMm),
    RECEIPT_PAPER_LIMITS.maxWidthMm,
  );
}

function parseSetting(raw: string): ReceiptPaperSetting | null {
  try {
    const parsed = JSON.parse(raw) as Partial<ReceiptPaperSetting> | null;
    if (!parsed || typeof parsed !== "object") return null;
    if (parsed.kind === "shopDefault" || parsed.kind === "a4") {
      return { kind: parsed.kind };
    }
    if (parsed.kind === "thermal") {
      const widthMm = Number((parsed as { widthMm?: unknown }).widthMm);
      if (!Number.isFinite(widthMm)) return null;
      return { kind: "thermal", widthMm: clampThermalWidthMm(widthMm) };
    }
    return null;
  } catch {
    return null;
  }
}

export function getStoredReceiptPaper(): ReceiptPaperSetting {
  try {
    const raw = localStorage.getItem(RECEIPT_PAPER_KEY);
    if (!raw) return DEFAULT_RECEIPT_PAPER_SETTING;
    return parseSetting(raw) ?? DEFAULT_RECEIPT_PAPER_SETTING;
  } catch {
    return DEFAULT_RECEIPT_PAPER_SETTING;
  }
}

export function saveReceiptPaper(value: ReceiptPaperSetting) {
  const normalized: ReceiptPaperSetting =
    value.kind === "thermal"
      ? { kind: "thermal", widthMm: clampThermalWidthMm(value.widthMm) }
      : value;

  try {
    localStorage.setItem(RECEIPT_PAPER_KEY, JSON.stringify(normalized));
  } catch {
    // ignore quota errors
  }
}

export function clearReceiptPaper() {
  try {
    localStorage.removeItem(RECEIPT_PAPER_KEY);
  } catch {
    // ignore quota errors
  }
}

export function resolvePaperWidthMm(
  setting: ReceiptPaperSetting,
  shopDefaultWidthMm: number | undefined,
): number {
  if (setting.kind === "a4") return A4_WIDTH_MM;
  if (setting.kind === "thermal") return clampThermalWidthMm(setting.widthMm);

  const shopDefault = Number(shopDefaultWidthMm);
  return Number.isFinite(shopDefault) && shopDefault > 0
    ? Math.round(shopDefault)
    : FALLBACK_PAPER_WIDTH_MM;
}
