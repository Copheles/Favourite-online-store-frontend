import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Package, Receipt, TrendingUp, Wallet } from "lucide-react";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
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
import { StatCard } from "@/components/shared/pos/StatCard";
import { PosToolbar } from "@/components/shared/pos/PosToolbar";
import { TableSkeleton } from "@/components/shared/pos/TableSkeleton";
import { useUrlLimit, useUrlPage, useUrlStringParam } from "@/hooks/useUrlQuery";
import { useSalesReport } from "@/hooks/useReports";
import { formatMoney, todayISO } from "@/lib/format";
import { PAGE_SIZE, PAGE_SIZE_OPTIONS } from "@/lib/queryConfig";
import {
  getDateRangeFilterSchema,
  type DateRangeFilterValues,
} from "@/validation/filter.validation";

export function SaleReportPage() {
  const { t } = useTranslation();
  const defaultFrom = todayISO();
  const defaultTo = todayISO();
  const [page, setPage] = useUrlPage();
  const [limit, setLimit] = useUrlLimit(
    PAGE_SIZE.default,
    PAGE_SIZE_OPTIONS.reports,
  );
  const [fromDate, setFromDate] = useUrlStringParam("from", defaultFrom);
  const [toDate, setToDate] = useUrlStringParam("to", defaultTo);

  const filterSchema = useMemo(() => getDateRangeFilterSchema(), []);
  const filterForm = useForm<DateRangeFilterValues>({
    resolver: zodResolver(filterSchema),
    defaultValues: {
      fromDate,
      toDate,
    },
  });

  useEffect(() => {
    filterForm.reset({ fromDate, toDate });
  }, [fromDate, toDate, filterForm]);

  const query = useSalesReport({
    fromDate: fromDate || defaultFrom,
    toDate: toDate || defaultTo,
    page,
    limit: limit,
  });

  const rows = query.data?.items ?? [];
  const summary = query.data?.summary;
  const totalPages = query.data?.meta.totalPages ?? 1;

  return (
    <PosPageShell>
      <PageHeader
        title={t("pos.modules.saleReport")}
        description={t("pos.reports.saleDescription")}
      />

      <PosToolbar>
        <Form {...filterForm}>
          <div className="grid w-full max-w-md grid-cols-2 gap-3">
            <FormField
              control={filterForm.control}
              name="fromDate"
              render={({ field }) => (
                <FormItem>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    {t("pos.reports.from")}
                  </label>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      onChange={(event) => {
                        field.onChange(event);
                        setFromDate(event.target.value);
                      }}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={filterForm.control}
              name="toDate"
              render={({ field }) => (
                <FormItem>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    {t("pos.reports.to")}
                  </label>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      onChange={(event) => {
                        field.onChange(event);
                        setToDate(event.target.value);
                      }}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </Form>
      </PosToolbar>

      {summary && (
        <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            icon={Package}
            label={t("pos.reports.soldQty")}
            value={summary.soldQty}
          />
          <StatCard
            icon={Receipt}
            label={t("pos.reports.gross")}
            value={formatMoney(summary.grossAmount)}
          />
          <StatCard
            icon={Wallet}
            label={t("pos.reports.net")}
            value={formatMoney(summary.netAmount)}
          />
          <StatCard
            icon={TrendingUp}
            label={t("pos.reports.profit")}
            value={formatMoney(summary.estimatedProfit)}
            accent
          />
        </div>
      )}

      {query.isLoading && !query.data && <TableSkeleton rows={8} cols={5} />}
      {query.isError && <ErrorState />}
      {!query.isLoading && rows.length === 0 && (
        <EmptyState message={t("pos.reports.empty")} />
      )}

      {!query.isLoading && rows.length > 0 && (
        <>
          <PosRecordCardList>
            {rows.map((row, idx) => (
              <PosRecordCard
                key={row.productId}
                title={row.productName}
                subtitle={row.categoryName}
                leading={<RankBadge rank={(page - 1) * limit + idx + 1} />}
                trailing={
                  <span className="text-sm font-semibold text-foreground">
                    {formatMoney(row.netAmount)}
                  </span>
                }
                fields={[
                  { label: t("pos.reports.soldQty"), value: row.soldQty },
                  {
                    label: t("pos.reports.net"),
                    value: formatMoney(row.netAmount),
                  },
                  {
                    label: t("pos.reports.unitCost"),
                    value: formatMoney(row.averageBuyPrice),
                  },
                  {
                    label: t("pos.reports.profit"),
                    value: formatMoney(row.estimatedProfit),
                  },
                ]}
              />
            ))}
          </PosRecordCardList>

          <PosDataTable className="hidden md:block">
            <PosTable>
              <PosTableHead>
                <tr>
                  <PosTableHeaderCell className="w-12 text-center">
                    #
                  </PosTableHeaderCell>
                  <PosTableHeaderCell>{t("pos.reports.product")}</PosTableHeaderCell>
                  <PosTableHeaderCell>{t("pos.reports.category")}</PosTableHeaderCell>
                  <PosTableHeaderCell className="text-right">
                    {t("pos.reports.soldQty")}
                  </PosTableHeaderCell>
                  <PosTableHeaderCell className="text-right">
                    {t("pos.reports.gross")}
                  </PosTableHeaderCell>
                  <PosTableHeaderCell className="text-right">
                    {t("pos.reports.net")}
                  </PosTableHeaderCell>
                  <PosTableHeaderCell className="text-right">
                    {t("pos.reports.unitCost")}
                  </PosTableHeaderCell>
                  <PosTableHeaderCell className="text-right">
                    {t("pos.reports.profit")}
                  </PosTableHeaderCell>
                </tr>
              </PosTableHead>
              <PosTableBody>
                {rows.map((row, idx) => (
                  <PosTableRow key={row.productId}>
                    <PosTableCell className="text-center">
                      <RankBadge rank={(page - 1) * limit + idx + 1} />
                    </PosTableCell>
                    <PosTableCell className="font-medium">
                      {row.productName}
                    </PosTableCell>
                    <PosTableCell className="text-muted-foreground">
                      {row.categoryName}
                    </PosTableCell>
                    <PosTableCell className="text-right tabular-nums">
                      {row.soldQty}
                    </PosTableCell>
                    <PosTableCell className="text-right tabular-nums">
                      {formatMoney(row.grossAmount)}
                    </PosTableCell>
                    <PosTableCell className="text-right font-medium tabular-nums">
                      {formatMoney(row.netAmount)}
                    </PosTableCell>
                    <PosTableCell className="text-right tabular-nums text-muted-foreground">
                      {formatMoney(row.averageBuyPrice)}
                    </PosTableCell>
                    <PosTableCell className="text-right font-semibold tabular-nums text-primary">
                      {formatMoney(row.estimatedProfit)}
                    </PosTableCell>
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
        pageSizeOptions={PAGE_SIZE_OPTIONS.reports}
        onPageChange={setPage}
        onPageSizeChange={setLimit}
      />
    </PosPageShell>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const isTop = rank <= 3;
  return (
    <span
      className={
        isTop
          ? "inline-flex size-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary"
          : "inline-flex size-6 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground"
      }
    >
      {rank}
    </span>
  );
}
