import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getStoreSettings } from "@/apis/settings.api";
import { queryKeys } from "@/lib/queryKeys";
import {
  clearReceiptPaper,
  getStoredReceiptPaper,
  resolvePaperWidthMm,
  saveReceiptPaper,
  type ReceiptPaperSetting,
} from "@/lib/printSettingsStorage";

const RECEIPT_PAPER_CHANGED_EVENT = "pos-receipt-paper-changed";

export function useReceiptPrintSettings() {
  const [setting, setSetting] = useState<ReceiptPaperSetting>(() =>
    getStoredReceiptPaper(),
  );

  useEffect(() => {
    const sync = () => setSetting(getStoredReceiptPaper());
    window.addEventListener(RECEIPT_PAPER_CHANGED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(RECEIPT_PAPER_CHANGED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const settingsQuery = useQuery({
    queryKey: queryKeys.settings.store(),
    queryFn: getStoreSettings,
  });

  const shopDefaultWidthMm = settingsQuery.data?.receiptPaperWidthMm;

  const paperWidthMm = useMemo(
    () => resolvePaperWidthMm(setting, shopDefaultWidthMm),
    [setting, shopDefaultWidthMm],
  );

  const save = useCallback((next: ReceiptPaperSetting) => {
    saveReceiptPaper(next);
    setSetting(getStoredReceiptPaper());
    window.dispatchEvent(new Event(RECEIPT_PAPER_CHANGED_EVENT));
  }, []);

  const reset = useCallback(() => {
    clearReceiptPaper();
    setSetting(getStoredReceiptPaper());
    window.dispatchEvent(new Event(RECEIPT_PAPER_CHANGED_EVENT));
  }, []);

  return {
    setting,
    paperWidthMm,
    isA4: setting.kind === "a4",
    shopDefaultWidthMm,
    save,
    reset,
  };
}
