import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Popover } from "radix-ui";
import { Check, ChevronDown, Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { StockStatusBadge } from "@/components/shared/pos/StockStatusBadge";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { usePosProducts } from "@/hooks/usePos";
import type { PosProduct } from "@/types/api";
import { cn } from "@/lib/utils";

interface ProductComboboxProps {
  value: string;
  selectedLabel?: string;
  onChange: (productId: string, product: PosProduct) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  branchId?: string;
}

export function ProductCombobox({
  value,
  selectedLabel,
  onChange,
  placeholder,
  disabled,
  id,
  branchId,
}: ProductComboboxProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 250);

  const query = usePosProducts(
    { search: debouncedSearch || undefined, page: 1, limit: 20, branchId },
    { enabled: open },
  );
  const products = query.data?.items ?? [];

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          id={id}
          disabled={disabled}
          className="relative flex h-10 w-full min-w-0 items-center rounded-lg border border-input bg-background py-2 pl-3 pr-9 text-left text-sm leading-normal shadow-xs transition-all hover:border-ring/40 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span
            className={cn(
              "min-w-0 flex-1 truncate",
              !selectedLabel && "text-muted-foreground",
            )}
          >
            {selectedLabel || placeholder || t("pos.stock.searchProduct")}
          </span>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={4}
          className="z-50 w-(--radix-popover-trigger-width) overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-md"
        >
          <div className="border-b border-border/60 p-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                autoFocus
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t("pos.stock.searchProduct")}
                className="h-9 pl-9"
              />
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto p-1">
            {query.isLoading && (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                {t("pos.common.loading")}
              </div>
            )}

            {!query.isLoading && products.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                {t("pos.stock.noProductsFound")}
              </p>
            )}

            {!query.isLoading &&
              products.map((product) => {
                const isSelected = product.productId === value;
                return (
                  <button
                    key={product.productId}
                    type="button"
                    onClick={() => {
                      onChange(product.productId, product);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm outline-none transition-colors hover:bg-muted focus-visible:bg-muted",
                      isSelected && "bg-muted/60",
                    )}
                  >
                    <span className="flex size-4 shrink-0 items-center justify-center">
                      {isSelected && <Check className="size-4 text-primary" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-foreground">
                        {product.name}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {product.code} · {t("pos.sale.stock")}: {product.stockQty}
                      </span>
                    </span>
                    <StockStatusBadge
                      status={product.stockStatus}
                      className="shrink-0"
                    />
                  </button>
                );
              })}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
