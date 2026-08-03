import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, ChevronDown, Loader2, Search, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PosModal } from "@/components/shared/pos/PosModal";
import { CustomerFormModal } from "@/components/shared/pos/CustomerFormModal";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import {
  useCustomer,
  useCustomerMutations,
  useCustomers,
} from "@/hooks/useCustomers";
import type { Customer } from "@/types/api";
import type { CustomerFormValues } from "@/validation/customer.validation";
import { cn } from "@/lib/utils";

interface CustomerComboboxProps {
  value: string;
  onChange: (customerId: string, customer?: Customer) => void;
  walkInLabel: string;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
}

export function CustomerCombobox({
  value,
  onChange,
  walkInLabel,
  placeholder,
  disabled,
  id,
  className,
}: CustomerComboboxProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 250);
  const { create } = useCustomerMutations();

  const customersQuery = useCustomers(
    {
      search: debouncedSearch || undefined,
      page: 1,
      limit: 20,
      isActive: true,
    },
    { enabled: open },
  );
  const selectedCustomerQuery = useCustomer(value || undefined);

  const customers = customersQuery.data?.items ?? [];
  const isWalkIn = !value;

  const displayLabel = useMemo(() => {
    if (isWalkIn) return walkInLabel;
    return selectedCustomerQuery.data?.name ?? walkInLabel;
  }, [isWalkIn, selectedCustomerQuery.data?.name, walkInLabel]);

  function closePicker() {
    setOpen(false);
    setSearch("");
  }

  function selectCustomer(customerId: string, customer?: Customer) {
    onChange(customerId, customer);
    closePicker();
  }

  function handleCreate(values: CustomerFormValues) {
    create.mutate(values, {
      onSuccess: (customer) => {
        onChange(customer.id, customer);
        setCreateOpen(false);
        closePicker();
      },
    });
  }

  return (
    <>
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => setOpen(true)}
        className={cn(
          "relative flex h-10 w-full min-w-0 items-center rounded-lg border border-input bg-background py-2 pl-3 pr-9 text-left text-sm leading-normal shadow-xs transition-all hover:border-ring/40 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
      >
        <span className="min-w-0 flex-1 truncate text-foreground">
          {displayLabel}
        </span>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      </button>

      {open && (
        <PosModal
          title={t("pos.sale.member")}
          description={t("pos.members.searchPlaceholder")}
          onClose={closePicker}
          closeLabel={t("pos.common.close")}
          wide
        >
          <div className="mt-4 space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                autoFocus
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={
                  placeholder ?? t("pos.members.searchPlaceholder")
                }
                className="h-10 pl-9"
              />
            </div>

            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                className="gap-1.5"
                onClick={() => setCreateOpen(true)}
              >
                <UserPlus className="size-4" />
                {t("pos.members.add")}
              </Button>
            </div>

            <div className="max-h-[min(50vh,24rem)] overflow-y-auto rounded-xl border border-border/70">
              <button
                type="button"
                onClick={() => selectCustomer("")}
                className={cn(
                  "flex w-full items-center gap-3 border-b border-border/50 px-3 py-3 text-left text-sm outline-none transition-colors hover:bg-muted focus-visible:bg-muted",
                  isWalkIn && "bg-muted/60",
                )}
              >
                <span className="flex size-5 shrink-0 items-center justify-center">
                  {isWalkIn && <Check className="size-4 text-primary" />}
                </span>
                <span className="min-w-0 flex-1 truncate font-medium text-foreground">
                  {walkInLabel}
                </span>
              </button>

              {customersQuery.isLoading && (
                <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  {t("pos.common.loading")}
                </div>
              )}

              {!customersQuery.isLoading && customers.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  {t("pos.members.empty")}
                </p>
              )}

              {!customersQuery.isLoading &&
                customers.map((customer) => {
                  const isSelected = customer.id === value;
                  return (
                    <button
                      key={customer.id}
                      type="button"
                      onClick={() => selectCustomer(customer.id, customer)}
                      className={cn(
                        "flex w-full items-center gap-3 border-b border-border/50 px-3 py-3 text-left text-sm outline-none transition-colors last:border-b-0 hover:bg-muted focus-visible:bg-muted",
                        isSelected && "bg-muted/60",
                      )}
                    >
                      <span className="flex size-5 shrink-0 items-center justify-center">
                        {isSelected && (
                          <Check className="size-4 text-primary" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium text-foreground">
                          {customer.name}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {customer.phone || t("pos.members.noPhone")}
                        </span>
                      </span>
                    </button>
                  );
                })}
            </div>
          </div>
        </PosModal>
      )}

      {createOpen && (
        <div className="relative z-50">
          <CustomerFormModal
            customer={null}
            isPending={create.isPending}
            error={create.error}
            onClose={() => setCreateOpen(false)}
            onSubmit={handleCreate}
          />
        </div>
      )}
    </>
  );
}
