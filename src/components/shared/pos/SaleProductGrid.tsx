import { memo, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, Loader2, PackagePlus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { CardGridSkeleton } from "@/components/shared/pos/TableSkeleton";
import { EmptyState, ErrorState } from "@/components/shared/PageStates";
import { PosFilterTabs } from "@/components/shared/pos/PosFilterTabs";
import { PosSearchBar } from "@/components/shared/pos/PosSearchBar";
import { useAppliedSearch } from "@/hooks/useAppliedSearch";
import { useCategories } from "@/hooks/useAdmin";
import { usePosProducts } from "@/hooks/usePos";
import {
  useUrlEnumParam,
  useUrlLimit,
  useUrlPage,
  useUrlQueryUpdater,
  useUrlStringParam,
} from "@/hooks/useUrlQuery";
import { formatMoney } from "@/lib/format";
import {
  STOCK_STATUS_FILTERS,
  stockStatusToApi,
  type StockStatusFilter,
} from "@/lib/listFilters";
import { PAGE_SIZE, PAGE_SIZE_OPTIONS } from "@/lib/queryConfig";
import { resetUrlPage, writeUrlString } from "@/lib/urlQuery";
import { cn } from "@/lib/utils";
import type { PosProduct } from "@/types/api";

type SaleProductGridProps = {
  canRestock: boolean;
  onAddProduct: (product: PosProduct) => void;
  onRestock: () => void;
  className?: string;
};

export const SaleProductGrid = memo(function SaleProductGrid({
  canRestock,
  onAddProduct,
  onRestock,
  className,
}: SaleProductGridProps) {
  const { t } = useTranslation();
  const {
    searchInput,
    setSearchInput,
    appliedSearch,
    submitSearch,
    resetSearch,
  } = useAppliedSearch();
  const updateUrl = useUrlQueryUpdater();
  const [topCategoryId] = useUrlStringParam("top");
  const [subCategoryId, setSubCategoryId] = useUrlStringParam("sub");
  const [productPage, setProductPage] = useUrlPage();
  const [productLimit, setProductLimit] = useUrlLimit(
    PAGE_SIZE.saleProducts,
    PAGE_SIZE_OPTIONS.saleProducts,
  );
  const [stockFilter, setStockFilter] = useUrlEnumParam<StockStatusFilter>(
    "stock",
    "ALL",
    STOCK_STATUS_FILTERS,
  );
  const [allProducts, setAllProducts] = useState<PosProduct[]>([]);

  const topCategoriesQuery = useCategories("TOP");
  const subCategoriesQuery = useCategories("SUB");

  const topCategoryOptions = useMemo(
    () => topCategoriesQuery.data?.items ?? [],
    [topCategoriesQuery.data?.items],
  );

  const subCategoryOptions = useMemo(() => {
    const items = subCategoriesQuery.data?.items ?? [];
    if (!topCategoryId) return items;
    return items.filter((category) => category.parentId === topCategoryId);
  }, [subCategoriesQuery.data?.items, topCategoryId]);

  useEffect(() => {
    if (
      subCategoryId &&
      !subCategoryOptions.some((category) => category.id === subCategoryId)
    ) {
      updateUrl((params) => {
        params.delete("sub");
      }, { resetPage: false });
    }
  }, [subCategoryId, subCategoryOptions, updateUrl]);

  const hasCategoryFilters = Boolean(topCategoryId || subCategoryId);

  function resetCategoryFilters() {
    updateUrl((params) => {
      params.delete("top");
      params.delete("sub");
      resetUrlPage(params);
    });
    setAllProducts([]);
  }

  const productQueryParams = useMemo(
    () => ({
      search: appliedSearch || undefined,
      topCategoryId: topCategoryId || undefined,
      subCategoryId: subCategoryId || undefined,
      stockStatus: stockStatusToApi(stockFilter),
      page: productPage,
      limit: productLimit,
    }),
    [
      appliedSearch,
      topCategoryId,
      subCategoryId,
      stockFilter,
      productPage,
      productLimit,
    ],
  );

  const productQuery = usePosProducts(productQueryParams, {
    keepPrevious: false,
  });

  useEffect(() => {
    setAllProducts([]);
  }, [appliedSearch, topCategoryId, subCategoryId, stockFilter, productLimit]);

  useEffect(() => {
    if (!productQuery.data || productQuery.isFetching) return;
    setAllProducts((prev) => {
      if (productPage === 1) return productQuery.data.items;
      const existingIds = new Set(prev.map((p) => p.productId));
      const next = productQuery.data.items.filter(
        (p) => !existingIds.has(p.productId),
      );
      return [...prev, ...next];
    });
  }, [productQuery.data, productQuery.isFetching, productPage]);

  const totalProductPages = productQuery.data?.meta.totalPages ?? 1;
  const hasMoreProducts = productPage < totalProductPages;
  const totalProducts = productQuery.data?.meta.total ?? 0;

  return (
    <div className={cn("min-h-0 flex-1 flex-col lg:min-w-0", className)}>
      <div className="shrink-0 border-b border-border/80 bg-card px-3 py-2 sm:px-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <PosSearchBar
              value={searchInput}
              onChange={setSearchInput}
              onSubmit={() => {
                submitSearch();
                setAllProducts([]);
              }}
              onClear={() => {
                resetSearch();
                setAllProducts([]);
              }}
              placeholder={t("pos.sale.searchProducts")}
              className="w-full max-w-none flex-1"
            />
            {canRestock && (
              <Button
                type="button"
                variant="outline"
                className="h-9 shrink-0 gap-1.5 px-3"
                onClick={onRestock}
                title={t("pos.stock.restock")}
              >
                <PackagePlus className="size-4 shrink-0" />
                <span className="hidden sm:inline">{t("pos.stock.restock")}</span>
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
            <Select
              id="sale-top-category"
              aria-label={t("pos.settings.topCategory")}
              value={topCategoryId}
              className="h-9 text-sm"
              onChange={(e) => {
                updateUrl((params) => {
                  writeUrlString(params, "top", e.target.value);
                  params.delete("sub");
                  resetUrlPage(params);
                });
                setAllProducts([]);
              }}
            >
              <option value="">{t("pos.sale.allCategories")}</option>
              {topCategoryOptions.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>

            <Select
              id="sale-sub-category"
              aria-label={t("pos.settings.subCategory")}
              value={subCategoryId}
              className="h-9 text-sm"
              onChange={(e) => {
                setSubCategoryId(e.target.value);
                setAllProducts([]);
              }}
              disabled={subCategoryOptions.length === 0}
            >
              <option value="">{t("pos.sale.allSubCategories")}</option>
              {subCategoryOptions.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 w-full gap-1.5 px-2.5 sm:col-span-2 xl:col-span-1 xl:w-auto"
              disabled={!hasCategoryFilters}
              onClick={resetCategoryFilters}
              title={t("pos.sale.resetCategories")}
            >
              <RotateCcw className="size-3.5 shrink-0" />
              {t("pos.sale.resetCategories")}
            </Button>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <PosFilterTabs
              value={stockFilter}
              options={STOCK_STATUS_FILTERS}
              onChange={setStockFilter}
              getLabel={(value) => t(`pos.filters.stock.${value}`)}
              align="start"
              className="min-w-0 w-full sm:flex-1"
            />
            <div className="flex shrink-0 items-center gap-2 self-stretch sm:self-auto">
              <span className="whitespace-nowrap text-xs font-medium text-muted-foreground">
                {t("pos.common.batchSize")}
              </span>
              <Select
                aria-label={t("pos.common.batchSize")}
                value={String(productLimit)}
                onChange={(event) => setProductLimit(Number(event.target.value))}
                className="h-9 w-[4.75rem] shrink-0 text-sm"
              >
                {PAGE_SIZE_OPTIONS.saleProducts.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
        {productQuery.isFetching &&
          productPage === 1 &&
          allProducts.length === 0 && <CardGridSkeleton />}
        {productQuery.isError && <ErrorState />}
        {!productQuery.isFetching && allProducts.length === 0 && (
          <EmptyState message={t("pos.sale.noProducts")} />
        )}
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-2 sm:gap-3 md:grid-cols-3 lg:grid-cols-[repeat(auto-fill,minmax(10.5rem,1fr))] xl:grid-cols-[repeat(auto-fill,minmax(12rem,1fr))]">
          {allProducts.map((product) => (
            <SaleProductCard
              key={product.productId}
              product={product}
              onAdd={onAddProduct}
            />
          ))}
        </div>

        {hasMoreProducts && (
          <div className="mt-6 flex flex-col items-center gap-2.5 pb-1">
            {totalProducts > 0 && !productQuery.isFetching && (
              <p className="text-xs font-medium text-muted-foreground/80">
                {t("pos.sale.productsShown", {
                  shown: allProducts.length,
                  total: totalProducts,
                })}
              </p>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={productQuery.isFetching}
              onClick={() => setProductPage(productPage + 1)}
              className="h-9 min-w-[9.5rem] rounded-full border-border/70 bg-card px-5 text-sm font-medium shadow-sm hover:bg-muted/40"
            >
              {productQuery.isFetching ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  {t("pos.common.loading")}
                </>
              ) : (
                <>
                  <ChevronDown className="size-3.5 text-muted-foreground" />
                  {t("pos.sale.loadMore")}
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
});

const SaleProductCard = memo(function SaleProductCard({
  product,
  onAdd,
}: {
  product: PosProduct;
  onAdd: (product: PosProduct) => void;
}) {
  const { t } = useTranslation();
  const inStock = product.isSellable;
  const lowStock = inStock && product.stockQty <= 5;

  const stockLabel = !inStock
    ? t("pos.sale.outOfStock")
    : t("pos.sale.stockLeft", { count: product.stockQty });

  const priceClassName =
    "truncate text-sm font-semibold tabular-nums tracking-tight sm:text-base lg:text-[15px] xl:text-[17px] 2xl:text-lg text-foreground";

  return (
    <button
      type="button"
      disabled={!inStock}
      onClick={() => onAdd(product)}
      className={cn(
        "group flex min-h-[112px] flex-col rounded-xl border p-2.5 text-left transition-[border-color,background-color,box-shadow] duration-150 sm:min-h-[120px] sm:p-3 lg:min-h-[128px] lg:p-3 xl:min-h-[132px] xl:p-3.5",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25 disabled:opacity-100",
        inStock
          ? "relative cursor-pointer border-border/80 bg-card hover:border-primary/25 hover:bg-primary/[0.04] hover:shadow-sm active:scale-[0.99]"
          : "relative cursor-not-allowed border-border/60 bg-muted/20 ring-1 ring-inset ring-border/40",
      )}
    >
      <p
        className={cn(
          "line-clamp-2 flex-1 text-xs font-medium leading-snug sm:text-sm lg:text-sm lg:leading-normal xl:text-base 2xl:text-[17px] 2xl:leading-snug",
          inStock ? "text-foreground/90" : "text-foreground/80",
        )}
      >
        {product.name}
      </p>

      <div
        className={cn(
          "mt-3 flex items-center justify-between gap-2 border-t pt-3",
          inStock ? "border-border/50" : "border-border/40",
        )}
      >
        <span className={priceClassName}>
          {formatMoney(product.finalPrice)}
        </span>

        <span
          className={cn(
            "shrink-0 rounded-md px-2 py-0.5 text-[10px] font-medium tabular-nums sm:text-xs lg:text-[11px] xl:text-xs 2xl:text-[13px]",
            !inStock &&
              "border border-destructive/20 bg-destructive/10 text-destructive/90",
            inStock &&
              lowStock &&
              "bg-amber-500/10 text-amber-800/90 dark:text-amber-200/90",
            inStock && !lowStock && "bg-muted/60 text-muted-foreground",
          )}
        >
          {stockLabel}
        </span>
      </div>
    </button>
  );
});
