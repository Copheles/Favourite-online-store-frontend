import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Plus, PackagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  EmptyState,
  ErrorState,
  PageHeader,
} from "@/components/shared/PageStates";
import {
  PosDataTable,
  PosTable,
  PosTableBody,
  PosTableCell,
  PosTableHead,
  PosTableHeaderCell,
  PosTableRow,
} from "@/components/shared/pos/PosDataTable";
import { PosPageShell } from "@/components/shared/pos/PosPageShell";
import {
  PosRecordCard,
  PosRecordCardList,
} from "@/components/shared/pos/PosRecordCard";
import { PosPagination } from "@/components/shared/pos/PosPagination";
import { PosSearchBar } from "@/components/shared/pos/PosSearchBar";
import {
  PosSummaryCard,
  PosSummaryCards,
} from "@/components/shared/pos/PosSummaryCards";
import { PosToolbar, PosToolbarActions, PosToolbarGroup } from "@/components/shared/pos/PosToolbar";
import { TableSkeleton } from "@/components/shared/pos/TableSkeleton";
import { RestockModal } from "@/components/shared/pos/RestockModal";
import { PosToaster, usePosToast } from "@/components/shared/pos/PosToast";
import { useAppliedSearch } from "@/hooks/useAppliedSearch";
import { useBranch } from "@/hooks/useBranch";
import { useUrlLimit, useUrlPage, useUrlStringParam } from "@/hooks/useUrlQuery";
import { useInventoryBalance, useStockMovements } from "@/hooks/useStock";
import { formatDate, formatMoney } from "@/lib/format";
import { PAGE_SIZE, PAGE_SIZE_OPTIONS } from "@/lib/queryConfig";
import { resetUrlPage } from "@/lib/urlQuery";

export function StockPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { canRestock, canWriteCatalog, currentBranch } = useBranch();
  const { toasts, showToast, dismiss } = usePosToast();
  const [, setSearchParams] = useSearchParams();
  const {
    searchInput,
    setSearchInput,
    appliedSearch,
    submitSearch,
    resetSearch,
  } = useAppliedSearch();
  const [page, setPage] = useUrlPage();
  const [limit, setLimit] = useUrlLimit(PAGE_SIZE.stock, PAGE_SIZE_OPTIONS.stock);
  const [fromDate, setFromDate] = useUrlStringParam("from");
  const [toDate, setToDate] = useUrlStringParam("to");
  const [restockOpen, setRestockOpen] = useState(false);

  const summaryQuery = useInventoryBalance({
    page: 1,
    limit: 1,
    sortBy: "name",
    sortOrder: "asc",
  });
  const summary = summaryQuery.data?.summary;

  const query = useStockMovements({
    search: appliedSearch || undefined,
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
    page,
    limit,
  });

  const rows = query.data?.items ?? [];
  const totalPages = query.data?.meta.totalPages ?? 1;
  const hasActiveFilters = Boolean(appliedSearch || fromDate || toDate);
  const branchLabel = currentBranch
    ? `${currentBranch.name} (${currentBranch.code})`
    : null;

  function resetFilters() {
    setSearchInput("");
    setFromDate("");
    setToDate("");
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("q");
      next.delete("from");
      next.delete("to");
      next.delete("type");
      resetUrlPage(next);
      return next;
    });
  }

  return (
    <PosPageShell>
      <PageHeader
        title={t("pos.modules.stockList")}
        description={
          branchLabel
            ? `${t("pos.stock.historyDescription")} ${t("pos.stock.viewingBranch", { branch: branchLabel })}`
            : t("pos.stock.historyDescription")
        }
        action={
          (canWriteCatalog || canRestock) ? (
            <div className="flex flex-wrap gap-2">
              {canWriteCatalog && (
                <Button
                  variant="outline"
                  onClick={() => navigate("/products/create")}
                >
                  <Plus className="size-4" />
                  {t("pos.settings.addProduct")}
                </Button>
              )}
              {canRestock && (
                <Button onClick={() => setRestockOpen(true)}>
                  <PackagePlus className="size-4" />
                  {t("pos.stock.restock")}
                </Button>
              )}
            </div>
          ) : undefined
        }
      />

      {summary && (
        <PosSummaryCards>
          <PosSummaryCard
            label={t("pos.stock.totalProducts")}
            value={summary.totalProducts}
          />
          <PosSummaryCard
            label={t("pos.stock.totalQty")}
            value={summary.totalStockQty}
          />
          <PosSummaryCard
            label={t("pos.stock.lowStock")}
            value={summary.lowStockCount}
          />
          <PosSummaryCard
            label={t("pos.stock.outOfStock")}
            value={summary.outOfStockCount}
            accent
          />
        </PosSummaryCards>
      )}

      <div>
        <h2 className="mb-3 text-lg font-bold text-foreground">
          {t("pos.stock.movementHistory")}
        </h2>
        <PosToolbar className="mb-4">
          <PosToolbarGroup>
            <PosSearchBar
              value={searchInput}
              onChange={setSearchInput}
              onSubmit={submitSearch}
              onClear={resetSearch}
              placeholder={t("pos.stock.searchPlaceholder")}
              className="w-full min-w-0 max-w-none lg:col-span-2"
            />
            <Input
              type="date"
              aria-label={t("pos.stock.dateFrom")}
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
            />
            <Input
              type="date"
              aria-label={t("pos.stock.dateTo")}
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
            />
          </PosToolbarGroup>
          <PosToolbarActions>
            <Button variant="outline" size="sm" onClick={resetFilters}>
              {t("pos.common.reset")}
            </Button>
          </PosToolbarActions>
        </PosToolbar>
      </div>

      {query.isLoading && !query.data && <TableSkeleton rows={8} cols={6} />}
      {query.isError && <ErrorState />}
      {!query.isLoading && rows.length === 0 && (
        <EmptyState
          message={
            hasActiveFilters
              ? t("pos.stock.noMovementsFiltered")
              : t("pos.stock.noMovements")
          }
        />
      )}

      {!query.isLoading && rows.length > 0 && (
        <>
          <PosRecordCardList>
            {rows.map((row) => (
              <PosRecordCard
                key={row.id}
                title={row.product?.name ?? row.productName ?? "-"}
                subtitle={row.product?.code ?? row.productCode ?? undefined}
                trailing={
                  <span className="text-sm font-semibold text-foreground">
                    +{row.quantity}
                  </span>
                }
                fields={[
                  {
                    label: t("pos.stock.purchaseDate"),
                    value: formatDate(row.purchaseDate),
                  },
                  {
                    label: t("pos.stock.buyPrice"),
                    value: row.buyPrice == null ? null : formatMoney(row.buyPrice),
                  },
                  { label: t("pos.stock.by"), value: row.createdBy?.username ?? null },
                  { label: t("pos.members.note"), value: row.note || null },
                ]}
              />
            ))}
          </PosRecordCardList>

          <PosDataTable className="hidden md:block">
            <PosTable>
              <PosTableHead>
                <tr>
                  <PosTableHeaderCell>{t("pos.stock.purchaseDate")}</PosTableHeaderCell>
                  <PosTableHeaderCell>{t("pos.stock.product")}</PosTableHeaderCell>
                  <PosTableHeaderCell>{t("pos.stock.qty")}</PosTableHeaderCell>
                  <PosTableHeaderCell>{t("pos.stock.buyPrice")}</PosTableHeaderCell>
                  <PosTableHeaderCell>{t("pos.members.note")}</PosTableHeaderCell>
                  <PosTableHeaderCell>{t("pos.stock.by")}</PosTableHeaderCell>
                </tr>
              </PosTableHead>
              <PosTableBody>
                {rows.map((row) => (
                  <PosTableRow key={row.id}>
                    <PosTableCell>{formatDate(row.purchaseDate)}</PosTableCell>
                    <PosTableCell className="font-medium">
                      <span className="block">
                        {row.product?.name ?? row.productName ?? "-"}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {row.product?.code ?? row.productCode ?? ""}
                      </span>
                    </PosTableCell>
                    <PosTableCell>{row.quantity}</PosTableCell>
                    <PosTableCell>
                      {row.buyPrice == null ? "-" : formatMoney(row.buyPrice)}
                    </PosTableCell>
                    <PosTableCell className="max-w-[16rem] truncate">
                      {row.note || "-"}
                    </PosTableCell>
                    <PosTableCell>{row.createdBy?.username ?? "-"}</PosTableCell>
                  </PosTableRow>
                ))}
              </PosTableBody>
            </PosTable>
          </PosDataTable>
        </>
      )}

      <PosPagination
        page={page}
        totalPages={totalPages}
        total={query.data?.meta.total}
        limit={limit}
        pageSizeOptions={PAGE_SIZE_OPTIONS.stock}
        onPageChange={setPage}
        onPageSizeChange={setLimit}
      />

      {canRestock && restockOpen && (
        <RestockModal
          onClose={() => setRestockOpen(false)}
          onSuccess={() => showToast("success", t("pos.stock.restockSuccess"))}
        />
      )}

      <PosToaster toasts={toasts} onDismiss={dismiss} />
    </PosPageShell>
  );
}
