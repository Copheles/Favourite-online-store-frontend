import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useSearchParams } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { PosModal } from "@/components/shared/pos/PosModal";
import { PosToaster, usePosToast } from "@/components/shared/pos/PosToast";
import {
  EmptyState,
  ErrorState,
  PageHeader,
} from "@/components/shared/PageStates";
import { PosPageShell } from "@/components/shared/pos/PosPageShell";
import { PosToolbar, PosToolbarActions, PosToolbarGroup } from "@/components/shared/pos/PosToolbar";
import { PosSearchBar } from "@/components/shared/pos/PosSearchBar";
import {
  PosDataTable,
  PosTable,
  PosTableBody,
  PosTableCell,
  PosTableHead,
  PosTableHeaderCell,
  PosTableRow,
} from "@/components/shared/pos/PosDataTable";
import {
  PosRecordCard,
  PosRecordCardList,
} from "@/components/shared/pos/PosRecordCard";
import { PosPagination } from "@/components/shared/pos/PosPagination";
import { TableSkeleton } from "@/components/shared/pos/TableSkeleton";
import { useOutstandingCustomers } from "@/hooks/useCustomers";
import { useAuth } from "@/hooks/useAuth";
import { useAddOrderPayment } from "@/hooks/useOrders";
import { useUrlLimit, useUrlPage } from "@/hooks/useUrlQuery";
import { formatDateTime, formatMoney } from "@/lib/format";
import { PAGE_SIZE, PAGE_SIZE_OPTIONS } from "@/lib/queryConfig";
import {
  readUrlString,
  resetUrlPage,
  writeUrlString,
} from "@/lib/urlQuery";
import {
  getSearchFilterSchema,
  type SearchFilterValues,
} from "@/validation/filter.validation";
import type { OutstandingItem, OutstandingOrder, PaymentType } from "@/types/api";

const PAYMENT_OPTIONS: PaymentType[] = ["CASH", "KBZPAY", "WAVEPAY", "CARD", "BANKING"];

export function OutstandingPage() {
  const { t } = useTranslation();
  const { canWrite } = useAuth();
  const { toasts, showToast, dismiss } = usePosToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [paymentTarget, setPaymentTarget] = useState<{
    customer: OutstandingItem["customer"];
    order: OutstandingOrder;
  } | null>(null);
  const [page, setPage] = useUrlPage();
  const [limit, setLimit] = useUrlLimit(
    PAGE_SIZE.default,
    PAGE_SIZE_OPTIONS.orders,
  );
  const appliedSearch = readUrlString(searchParams, "q");
  const filterSchema = useMemo(() => getSearchFilterSchema(), []);
  const filterForm = useForm<SearchFilterValues>({
    resolver: zodResolver(filterSchema),
    defaultValues: {
      search: appliedSearch,
    },
  });

  const outstandingQuery = useOutstandingCustomers({
    search: appliedSearch || undefined,
    page,
    limit,
  });
  const addPaymentMutation = useAddOrderPayment();

  const rows = outstandingQuery.data?.items ?? [];
  const totalPages = outstandingQuery.data?.meta.totalPages ?? 1;

  function applyFilters() {
    const values = filterForm.getValues();
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      writeUrlString(next, "q", values.search ?? "");
      resetUrlPage(next);
      return next;
    });
  }

  function resetFilters() {
    filterForm.reset({ search: "" });
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("q");
      resetUrlPage(next);
      return next;
    });
  }

  function clearSearch() {
    filterForm.setValue("search", "");
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("q");
      resetUrlPage(next);
      return next;
    });
  }

  return (
    <PosPageShell>
      <PageHeader
        title={t("pos.outstanding.title")}
        description={t("pos.outstanding.description")}
      />

      <PosToolbar>
        <Form {...filterForm}>
          <PosToolbarGroup>
            <FormField
              control={filterForm.control}
              name="search"
              render={({ field }) => (
                <FormItem className="w-full min-w-0 lg:col-span-2">
                  <FormControl>
                    <PosSearchBar
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      onSubmit={applyFilters}
                      onClear={clearSearch}
                      placeholder={t("pos.outstanding.searchPlaceholder")}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </PosToolbarGroup>
        </Form>
        <PosToolbarActions>
          <Button variant="outline" size="sm" onClick={resetFilters}>
            {t("pos.common.reset")}
          </Button>
        </PosToolbarActions>
      </PosToolbar>

      {outstandingQuery.isLoading && !outstandingQuery.data && (
        <TableSkeleton rows={8} cols={5} />
      )}
      {outstandingQuery.isError && <ErrorState />}
      {!outstandingQuery.isLoading && rows.length === 0 && (
        <EmptyState message={t("pos.outstanding.empty")} />
      )}

      {!outstandingQuery.isLoading && rows.length > 0 && (
        <>
          <PosRecordCardList>
            {rows.map((row) => (
              <OutstandingCard
                key={row.order.id}
                item={row}
                canAddPayment={canWrite}
                onAddPayment={() =>
                  setPaymentTarget({ customer: row.customer, order: row.order })
                }
              />
            ))}
          </PosRecordCardList>

          <PosDataTable className="hidden md:block">
            <PosTable>
              <PosTableHead>
                <tr>
                  <PosTableHeaderCell>{t("pos.orders.customer")}</PosTableHeaderCell>
                  <PosTableHeaderCell>{t("pos.members.phone")}</PosTableHeaderCell>
                  <PosTableHeaderCell>{t("pos.orders.invoice")}</PosTableHeaderCell>
                  <PosTableHeaderCell>{t("pos.orders.total")}</PosTableHeaderCell>
                  <PosTableHeaderCell>{t("pos.outstanding.paid")}</PosTableHeaderCell>
                  <PosTableHeaderCell>{t("pos.outstanding.totalOutstanding")}</PosTableHeaderCell>
                  <PosTableHeaderCell>{t("pos.orders.date")}</PosTableHeaderCell>
                  <PosTableHeaderCell />
                </tr>
              </PosTableHead>
              <PosTableBody>
                {rows.map((row) => (
                  <PosTableRow key={row.order.id}>
                    <PosTableCell className="font-medium">
                      {row.customer.name}
                    </PosTableCell>
                    <PosTableCell>{row.customer.phone ?? "-"}</PosTableCell>
                    <PosTableCell>{row.order.invoiceNumber}</PosTableCell>
                    <PosTableCell>{formatMoney(row.order.netTotal)}</PosTableCell>
                    <PosTableCell>{formatMoney(row.order.paidTotal)}</PosTableCell>
                    <PosTableCell className="font-semibold text-destructive">
                      {formatMoney(row.order.balanceDue)}
                    </PosTableCell>
                    <PosTableCell>
                      {formatDateTime(row.order.createdAt)}
                    </PosTableCell>
                    <PosTableCell>
                      <div className="flex flex-wrap gap-2">
                        {canWrite && (
                          <Button
                            type="button"
                            size="sm"
                            onClick={() =>
                              setPaymentTarget({
                                customer: row.customer,
                                order: row.order,
                              })
                            }
                          >
                            {t("pos.outstanding.addPayment")}
                          </Button>
                        )}
                        <Link
                          className="inline-flex h-8 items-center text-sm font-medium text-primary hover:underline"
                          to={`/orders/completed?customerId=${row.customer.id}`}
                        >
                          {t("pos.outstanding.viewOrders")}
                        </Link>
                      </div>
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
        total={outstandingQuery.data?.meta.total}
        limit={limit}
        pageSizeOptions={PAGE_SIZE_OPTIONS.orders}
        onPageChange={setPage}
        onPageSizeChange={setLimit}
      />

      {paymentTarget && (
        <OutstandingPaymentModal
          customerName={paymentTarget.customer.name}
          order={paymentTarget.order}
          saving={addPaymentMutation.isPending}
          onClose={() => setPaymentTarget(null)}
          onSubmit={(input) =>
            addPaymentMutation.mutate(
              { id: paymentTarget.order.id, input },
              {
                onSuccess: () => {
                  showToast("success", t("pos.outstanding.paymentRecorded"));
                  setPaymentTarget(null);
                },
              },
            )
          }
        />
      )}

      <PosToaster toasts={toasts} onDismiss={dismiss} />
    </PosPageShell>
  );
}

function OutstandingCard({
  item,
  canAddPayment,
  onAddPayment,
}: {
  item: OutstandingItem;
  canAddPayment: boolean;
  onAddPayment: () => void;
}) {
  const { t } = useTranslation();
  return (
    <PosRecordCard
      title={item.customer.name}
      subtitle={item.customer.phone ?? "-"}
      trailing={
        <span className="text-sm font-semibold text-destructive">
          {formatMoney(item.order.balanceDue)}
        </span>
      }
      fields={[
        { label: t("pos.orders.invoice"), value: item.order.invoiceNumber },
        { label: t("pos.orders.total"), value: formatMoney(item.order.netTotal) },
        { label: t("pos.outstanding.paid"), value: formatMoney(item.order.paidTotal) },
        {
          label: t("pos.orders.date"),
          value: formatDateTime(item.order.createdAt),
        },
      ]}
      actions={
        <div className="flex w-full flex-wrap gap-2">
          {canAddPayment && (
            <Button
              type="button"
              size="sm"
              onClick={onAddPayment}
            >
              {t("pos.outstanding.addPayment")}
            </Button>
          )}
          <Link
            className="inline-flex h-8 items-center text-sm font-medium text-primary hover:underline"
            to={`/orders/completed?customerId=${item.customer.id}`}
          >
            {t("pos.outstanding.viewOrders")}
          </Link>
        </div>
      }
    />
  );
}

function OutstandingPaymentModal({
  customerName,
  order,
  saving,
  onClose,
  onSubmit,
}: {
  customerName: string;
  order: OutstandingOrder;
  saving: boolean;
  onClose: () => void;
  onSubmit: (input: {
    paymentType: PaymentType;
    paidAmount: number;
    note: string | null;
  }) => void;
}) {
  const { t } = useTranslation();
  const [paymentType, setPaymentType] = useState<PaymentType>("CASH");
  const [paidAmount, setPaidAmount] = useState(String(order.balanceDue));
  const [note, setNote] = useState("");
  const amount = Number(paidAmount);
  const amountError =
    !Number.isFinite(amount) || amount <= 0
      ? t("pos.outstanding.amountGreaterThanZero")
      : amount > order.balanceDue
        ? t("pos.outstanding.amountTooHigh")
        : null;

  return (
    <PosModal
      title={t("pos.outstanding.addPayment")}
      description={`${customerName} · ${order.invoiceNumber}`}
      onClose={onClose}
      closeLabel={t("pos.common.close")}
    >
      <div className="mt-4 space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {t("pos.orders.total")}
            </p>
            <p className="mt-0.5 text-sm font-medium text-foreground">
              {formatMoney(order.netTotal)}
            </p>
          </div>
          <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {t("pos.orders.balanceDue")}
            </p>
            <p className="mt-0.5 text-sm font-semibold text-destructive">
              {formatMoney(order.balanceDue)}
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">
            {t("pos.sale.paymentType")}
          </label>
          <Select
            value={paymentType}
            onChange={(event) => setPaymentType(event.target.value as PaymentType)}
          >
            {PAYMENT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">
            {t("pos.sale.paidAmount")}
          </label>
          <Input
            type="number"
            min={0}
            max={order.balanceDue}
            value={paidAmount}
            onChange={(event) => setPaidAmount(event.target.value)}
          />
          {amountError && (
            <p className="text-xs font-medium text-destructive">{amountError}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">
            {t("pos.sale.orderNotes")}
          </label>
          <Input value={note} onChange={(event) => setNote(event.target.value)} />
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            {t("pos.common.cancel")}
          </Button>
          <Button
            type="button"
            disabled={Boolean(amountError) || saving}
            onClick={() =>
              onSubmit({
                paymentType,
                paidAmount: amount,
                note: note.trim() || null,
              })
            }
          >
            {saving ? t("pos.common.loading") : t("pos.common.save")}
          </Button>
        </div>
      </div>
    </PosModal>
  );
}
