import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApiErrorAlert } from "@/components/forms/ApiErrorAlert";
import type { ExportProductsExcelParams } from "@/apis/product.api";
import {
  useProductExcelExport,
  useProductExcelImport,
} from "@/hooks/useStock";
import { cn } from "@/lib/utils";

interface ProductExcelPanelProps {
  exportParams?: ExportProductsExcelParams;
  onImportApplied?: () => void;
  className?: string;
}

function formatRowMessages(
  rows: Record<string, string[]>,
  rowLabel: (row: string) => string,
): string[] {
  return Object.entries(rows).flatMap(([row, messages]) =>
    messages.map((message) => `${rowLabel(row)}: ${message}`),
  );
}

export function ProductExcelPanel({
  exportParams,
  onImportApplied,
  className,
}: ProductExcelPanelProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const importMutation = useProductExcelImport();
  const exportMutation = useProductExcelExport();

  const summary = importMutation.data;
  const errorCount = summary ? Object.keys(summary.errors).length : 0;
  const warningCount = summary ? Object.keys(summary.warnings).length : 0;
  const canApply =
    summary?.dryRun === true && errorCount === 0 && selectedFile != null;

  function handleFileSelect(file: File | undefined) {
    if (!file) return;
    setSelectedFile(file);
    importMutation.mutate({ file, dryRun: true });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleApplyImport() {
    if (!selectedFile) return;
    importMutation.mutate(
      { file: selectedFile, dryRun: false },
      {
        onSuccess: (result) => {
          if (!result.dryRun) {
            onImportApplied?.();
          }
        },
      },
    );
  }

  async function handleExport() {
    const blob = await exportMutation.mutateAsync(exportParams ?? {});
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `stock-products-${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  const errorLines = summary
    ? formatRowMessages(summary.errors, (row) =>
        t("pos.excel.row", { row }),
      )
    : [];
  const warningLines = summary
    ? formatRowMessages(summary.warnings, (row) =>
        t("pos.excel.row", { row }),
      )
    : [];

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="hidden"
          onChange={(event) => handleFileSelect(event.target.files?.[0])}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={importMutation.isPending}
        >
          <Upload className="size-4" />
          {importMutation.isPending
            ? t("pos.excel.checking")
            : t("pos.excel.import")}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={exportMutation.isPending}
        >
          <Download className="size-4" />
          {exportMutation.isPending
            ? t("pos.excel.exporting")
            : t("pos.excel.export")}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">{t("pos.excel.hint")}</p>

      <ApiErrorAlert
        error={importMutation.error}
        fallback={t("pos.excel.importFailed")}
      />
      <ApiErrorAlert
        error={exportMutation.error}
        fallback={t("pos.excel.exportFailed")}
      />

      {summary && (
        <div
          className={cn(
            "rounded-xl border p-4 text-sm",
            errorCount > 0
              ? "border-destructive/30 bg-destructive/10 text-destructive"
              : summary.dryRun
                ? "border-success/30 bg-success/10 text-success-foreground"
                : "border-success/30 bg-success/10 text-success-foreground",
          )}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-semibold">
                {errorCount > 0
                  ? t("pos.excel.validationFailed")
                  : summary.dryRun
                    ? t("pos.excel.checked")
                    : t("pos.excel.completed")}
              </p>
              {selectedFile && (
                <p className="mt-1 text-xs opacity-80">{selectedFile.name}</p>
              )}
              <p className="mt-1 text-xs opacity-80">
                {t("pos.excel.totalRows", { count: summary.totalRows })}
              </p>
            </div>
            {canApply && (
              <Button
                size="sm"
                onClick={handleApplyImport}
                disabled={importMutation.isPending}
              >
                {t("pos.excel.applyImport")}
              </Button>
            )}
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
            <Stat label={t("pos.excel.stats.categories")} value={summary.createdCategories} />
            <Stat label={t("pos.excel.stats.created")} value={summary.createdProducts} />
            <Stat label={t("pos.excel.stats.updated")} value={summary.updatedProducts} />
            <Stat
              label={t("pos.excel.stats.stockMoves")}
              value={summary.stockQtyAdjusted}
            />
            <Stat
              label={t("pos.excel.stats.openingMovements")}
              value={
                summary.dryRun
                  ? summary.openingMovementsPlanned
                  : summary.openingMovementsCreated
              }
            />
            <Stat
              label={t("pos.excel.stats.negativeQty")}
              value={summary.negativeQtyRows}
            />
            <Stat
              label={t("pos.excel.stats.buyPriceResolved")}
              value={summary.buyPriceResolvedRows}
            />
            <Stat label={t("pos.excel.stats.skipped")} value={summary.skippedRows} />
          </div>

          {errorCount > 0 && (
            <MessageList
              title={t("pos.excel.errorCount", { count: errorCount })}
              lines={errorLines}
              tone="error"
            />
          )}

          {warningCount > 0 && (
            <MessageList
              title={t("pos.excel.warningCount", { count: warningCount })}
              lines={warningLines}
              tone="warning"
            />
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-card/60 px-2 py-1.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide opacity-70">
        {label}
      </p>
      <p className="text-base font-bold">{value}</p>
    </div>
  );
}

function MessageList({
  title,
  lines,
  tone,
}: {
  title: string;
  lines: string[];
  tone: "error" | "warning";
}) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const preview = lines.slice(0, 3);
  const visible = expanded ? lines : preview;

  return (
    <div className="mt-3">
      <p
        className={cn(
          "text-xs font-semibold",
          tone === "error" ? "text-destructive" : "text-warning-foreground",
        )}
      >
        {title}
      </p>
      <ul className="mt-1 space-y-1 text-xs opacity-90">
        {visible.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      {lines.length > 3 && (
        <button
          type="button"
          className="mt-2 text-xs font-semibold underline"
          onClick={() => setExpanded((prev) => !prev)}
        >
          {expanded
            ? t("pos.excel.showLess")
            : t("pos.excel.showAll", { count: lines.length })}
        </button>
      )}
    </div>
  );
}
