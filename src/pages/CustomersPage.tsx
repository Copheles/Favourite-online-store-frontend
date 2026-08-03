import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, LayoutGrid, List, Pencil, Plus, Trash2, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { PosModal } from "@/components/shared/pos/PosModal";
import { PosPageShell } from "@/components/shared/pos/PosPageShell";
import {
  PosRecordCard,
  PosRecordCardList,
} from "@/components/shared/pos/PosRecordCard";
import { CustomerFormModal } from "@/components/shared/pos/CustomerFormModal";
import { PosFilterSelect } from "@/components/shared/pos/PosFilterSelect";
import { PosPagination } from "@/components/shared/pos/PosPagination";
import { PosSearchBar } from "@/components/shared/pos/PosSearchBar";
import { CardGridSkeleton, TableSkeleton } from "@/components/shared/pos/TableSkeleton";
import { useAppliedSearch } from "@/hooks/useAppliedSearch";
import { useUrlEnumParam, useUrlLimit, useUrlPage, useUrlStringParam } from "@/hooks/useUrlQuery";
import { useCustomerMutations, useCustomers } from "@/hooks/useCustomers";
import { useAuth } from "@/hooks/useAuth";
import {
  CONTACT_FILTERS,
  contactFilterToApi,
  type ContactFilter,
} from "@/lib/listFilters";
import { PAGE_SIZE, PAGE_SIZE_OPTIONS } from "@/lib/queryConfig";
import type { Customer } from "@/types/api";
import { cn } from "@/lib/utils";
type ViewMode = "grid" | "list";

export function CustomersPage() {
  const { t } = useTranslation();
  const { canWrite } = useAuth();
  const {
    searchInput,
    setSearchInput,
    appliedSearch,
    submitSearch,
    resetSearch,
  } = useAppliedSearch();
  const [page, setPage] = useUrlPage();
  const [limit, setLimit] = useUrlLimit(
    PAGE_SIZE.members,
    PAGE_SIZE_OPTIONS.members,
  );
  const [contactFilter, setContactFilter] = useUrlEnumParam<ContactFilter>(
    "contact",
    "ALL",
    CONTACT_FILTERS,
  );
  const [viewRaw, setViewMode] = useUrlStringParam("view", "grid");
  const viewMode: ViewMode = viewRaw === "list" ? "list" : "grid";
  const [formOpen, setFormOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  const query = useCustomers({
    search: appliedSearch || undefined,
    contact: contactFilterToApi(contactFilter),
    page,
    limit,
  });
  const { create, update, remove } = useCustomerMutations();

  const rows = query.data?.items ?? [];
  const totalPages = query.data?.meta.totalPages ?? 1;

  function openCreate() {
    setEditingCustomer(null);
    setFormOpen(true);
  }

  function openEdit(customer: Customer) {
    setEditingCustomer(customer);
    setFormOpen(true);
  }

  function requestDelete(customer: Customer) {
    setCustomerToDelete(customer);
  }

  return (
    <PosPageShell>
      <PageHeader
        title={t("pos.modules.member")}
        description={t("pos.members.description")}
        action={
          canWrite ? (
            <Button onClick={openCreate}>
              <Plus className="size-4" />
              {t("pos.members.add")}
            </Button>
          ) : undefined
        }
      />

      <div className="mb-4 rounded-xl border border-border/70 bg-card px-4 py-3 shadow-sm sm:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => setFiltersOpen((open) => !open)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary/80"
          >
            {filtersOpen ? t("pos.members.hideFilters") : t("pos.members.showFilters")}
            <ChevronDown
              className={cn(
                "size-4 transition-transform duration-200",
                filtersOpen && "rotate-180",
              )}
            />
          </button>

          <div className="flex flex-col gap-3 sm:ml-auto sm:flex-row sm:items-center">
            <CustomerViewToggle
              viewMode={viewMode}
              onChange={(mode) => setViewMode(mode, { resetPage: false })}
            />
            <PosSearchBar
              value={searchInput}
              onChange={setSearchInput}
              onSubmit={submitSearch}
              onClear={resetSearch}
              placeholder={t("pos.members.searchPlaceholder")}
              hideButton
              className="w-full sm:w-auto sm:max-w-xs"
            />
          </div>
        </div>

        {filtersOpen && (
          <div className="mt-3 border-t border-border/60 pt-3">
            <PosFilterSelect
              value={contactFilter}
              options={CONTACT_FILTERS}
              onChange={setContactFilter}
              ariaLabel={t("pos.members.filterByContact")}
              getLabel={(value) => t(`pos.filters.contact.${value}`)}
            />
          </div>
        )}
      </div>

      {query.isLoading && !query.data && (
        viewMode === "grid" ? <CardGridSkeleton count={8} /> : <TableSkeleton />
      )}
      {query.isError && <ErrorState />}
      {!query.isLoading && rows.length === 0 && (
        <EmptyState message={t("pos.members.empty")} />
      )}

      {!query.isLoading && rows.length > 0 && viewMode === "grid" && (
        <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {rows.map((row) => (
            <CustomerCard
              key={row.id}
              customer={row}
              readOnly={!canWrite}
              onEdit={() => openEdit(row)}
              onDelete={() => requestDelete(row)}
            />
          ))}
        </div>
      )}

      {!query.isLoading && rows.length > 0 && viewMode === "list" && (
        <>
          <PosRecordCardList>
            {rows.map((row) => (
              <PosRecordCard
                key={row.id}
                title={row.name}
                fields={[
                  { label: t("pos.members.phone"), value: row.phone ?? null },
                  { label: t("pos.members.address"), value: row.address ?? null },
                  {
                    label: t("pos.members.points"),
                    value: String(row.pointsBalance ?? 0),
                  },
                ]}
                actions={
                  canWrite ? (
                    <>
                      <Button size="sm" variant="outline" onClick={() => openEdit(row)}>
                        {t("pos.common.edit")}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => requestDelete(row)}
                      >
                        {t("pos.common.delete")}
                      </Button>
                    </>
                  ) : undefined
                }
              />
            ))}
          </PosRecordCardList>

          <PosDataTable className="hidden md:block">
            <PosTable>
              <PosTableHead>
                <tr>
                  <PosTableHeaderCell>{t("pos.members.name")}</PosTableHeaderCell>
                  <PosTableHeaderCell>{t("pos.members.phone")}</PosTableHeaderCell>
                  <PosTableHeaderCell>{t("pos.members.address")}</PosTableHeaderCell>
                  <PosTableHeaderCell>{t("pos.members.points")}</PosTableHeaderCell>
                  <PosTableHeaderCell />
                </tr>
              </PosTableHead>
              <PosTableBody>
                {rows.map((row) => (
                  <PosTableRow key={row.id}>
                    <PosTableCell className="font-medium">{row.name}</PosTableCell>
                    <PosTableCell>{row.phone ?? "-"}</PosTableCell>
                    <PosTableCell>{row.address ?? "-"}</PosTableCell>
                    <PosTableCell className="tabular-nums">
                      {row.pointsBalance ?? 0}
                    </PosTableCell>
                    <PosTableCell>
                      {canWrite ? (
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => openEdit(row)}>
                            {t("pos.common.edit")}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => requestDelete(row)}
                          >
                            {t("pos.common.delete")}
                          </Button>
                        </div>
                      ) : null}
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
        pageSizeOptions={PAGE_SIZE_OPTIONS.members}
        onPageChange={setPage}
        onPageSizeChange={setLimit}
      />

      {customerToDelete && (
        <CustomerDeleteConfirmModal
          customer={customerToDelete}
          isPending={remove.isPending}
          onClose={() => setCustomerToDelete(null)}
          onConfirm={() => {
            remove.mutate(customerToDelete.id, {
              onSuccess: () => setCustomerToDelete(null),
            });
          }}
        />
      )}

      {formOpen && (
        <CustomerFormModal
          customer={editingCustomer}
          isPending={create.isPending || update.isPending}
          error={create.error || update.error}
          onClose={() => setFormOpen(false)}
          onSubmit={(values) => {
            if (editingCustomer) {
              update.mutate(
                { id: editingCustomer.id, input: values },
                { onSuccess: () => setFormOpen(false) },
              );
            } else {
              create.mutate(values, { onSuccess: () => setFormOpen(false) });
            }
          }}
        />
      )}
    </PosPageShell>
  );
}

function CustomerViewToggle({
  viewMode,
  onChange,
}: {
  viewMode: ViewMode;
  onChange: (mode: ViewMode) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-2.5">
      <span className="whitespace-nowrap text-sm text-muted-foreground">
        {viewMode === "grid"
          ? t("pos.members.showListView")
          : t("pos.members.showGridView")}
      </span>
      <div
        className="inline-flex shrink-0 rounded-lg border border-border/70 bg-muted/25 p-0.5"
        role="group"
        aria-label={t("pos.members.viewLayout")}
      >
        <button
          type="button"
          aria-pressed={viewMode === "grid"}
          onClick={() => onChange("grid")}
          className={cn(
            "inline-flex size-8 items-center justify-center rounded-md transition-colors",
            viewMode === "grid"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <LayoutGrid className="size-3.5" />
        </button>
        <button
          type="button"
          aria-pressed={viewMode === "list"}
          onClick={() => onChange("list")}
          className={cn(
            "inline-flex size-8 items-center justify-center rounded-md transition-colors",
            viewMode === "list"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <List className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

function getCustomerCardLabel(customer: Customer): string {
  const secondary = customer.address?.trim() || customer.phone?.trim();
  if (secondary) {
    return `${customer.name} (${secondary})`;
  }
  return customer.name;
}

function CustomerCard({
  customer,
  readOnly,
  onEdit,
  onDelete,
}: {
  customer: Customer;
  readOnly?: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const label = getCustomerCardLabel(customer);

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm transition-all hover:border-border hover:shadow-md">
      <div className="flex min-h-[148px] flex-col items-center justify-center bg-muted/15 px-3 pb-4 pt-5">
        <div className="flex size-[4.5rem] items-center justify-center rounded-full bg-gradient-to-b from-primary/10 to-primary/5 ring-1 ring-primary/10">
          <UserRound className="size-9 text-primary/65" strokeWidth={1.5} aria-hidden />
        </div>
        <p
          className="mt-3.5 w-full truncate px-1 text-center text-[13px] font-medium leading-snug text-foreground/90"
          title={label}
        >
          {label}
        </p>
      </div>

      {!readOnly && (
        <div className="grid grid-cols-2 divide-x divide-border/60 border-t border-border/60 bg-card">
          <button
            type="button"
            onClick={onEdit}
            className="flex items-center justify-center py-3 text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
            aria-label={t("pos.common.edit")}
          >
            <Pencil className="size-4" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="flex items-center justify-center py-3 text-muted-foreground transition-colors hover:bg-destructive/8 hover:text-destructive"
            aria-label={t("pos.common.delete")}
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function CustomerDeleteConfirmModal({
  customer,
  isPending,
  onClose,
  onConfirm,
}: {
  customer: Customer;
  isPending: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const { t } = useTranslation();

  return (
    <PosModal
      title={t("pos.members.deleteTitle")}
      description={t("pos.members.deleteConfirm", { name: customer.name })}
      onClose={onClose}
      closeLabel={t("pos.common.close")}
    >
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
          {t("pos.common.cancel")}
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={onConfirm}
          disabled={isPending}
        >
          {t("pos.common.delete")}
        </Button>
      </div>
    </PosModal>
  );
}
