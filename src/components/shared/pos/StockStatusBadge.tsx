import { useTranslation } from "react-i18next";
import type { DisplayStockStatus, StockStatus } from "@/types/api";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<DisplayStockStatus, string> = {
  OUT_OF_STOCK: "bg-destructive/10 text-destructive",
  NEGATIVE_STOCK: "bg-destructive/15 text-destructive ring-1 ring-destructive/30",
  LOW_STOCK: "bg-warning text-warning-foreground",
  IN_STOCK: "bg-success text-success-foreground",
};

export function StockStatusBadge({
  status,
  className,
}: {
  status: DisplayStockStatus | StockStatus;
  className?: string;
}) {
  const { t } = useTranslation();

  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-1 text-xs font-semibold",
        STATUS_STYLES[status],
        className,
      )}
    >
      {t(`pos.filters.stock.${status}`)}
    </span>
  );
}
