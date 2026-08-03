import type { ReceiptPaperSetting } from "@/lib/printSettingsStorage";
import {
  RECEIPT_PAPER_WIDTH_PRESETS,
  type ReceiptPaperFormValues,
} from "@/validation/settings.validation";

export function settingToFormValues(
  setting: ReceiptPaperSetting,
): ReceiptPaperFormValues {
  if (setting.kind === "a4") {
    return { mode: "a4", customWidthMm: 80 };
  }
  if (setting.kind === "thermal") {
    const preset = RECEIPT_PAPER_WIDTH_PRESETS.find(
      (width) => width === setting.widthMm,
    );
    return preset
      ? {
          mode: String(preset) as ReceiptPaperFormValues["mode"],
          customWidthMm: 80,
        }
      : { mode: "custom", customWidthMm: setting.widthMm };
  }
  return { mode: "shopDefault", customWidthMm: 80 };
}

export function formValuesToSetting(
  values: ReceiptPaperFormValues,
): ReceiptPaperSetting {
  if (values.mode === "shopDefault") return { kind: "shopDefault" };
  if (values.mode === "a4") return { kind: "a4" };
  if (values.mode === "custom") {
    return { kind: "thermal", widthMm: values.customWidthMm };
  }
  return { kind: "thermal", widthMm: Number(values.mode) };
}
