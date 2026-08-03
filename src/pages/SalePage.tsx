import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import {
  Layers,
  Minus,
  PauseCircle,
  Pencil,
  Plus,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PosModal } from "@/components/shared/pos/PosModal";
import { RestockModal } from "@/components/shared/pos/RestockModal";
import { OrderStatusBadge } from "@/components/shared/pos/OrderStatusBadge";
import { ReceiptTicket } from "@/components/receipt/ReceiptTicket";
import {
  LoadingState,
  PageHeader,
} from "@/components/shared/PageStates";
import { PosPageShell } from "@/components/shared/pos/PosPageShell";
import {
  SaleCheckoutPanel,
  SaleMobileCartBar,
} from "@/components/shared/pos/SaleCheckoutPanel";
import { SaleProductGrid } from "@/components/shared/pos/SaleProductGrid";
import { PosToaster, usePosToast } from "@/components/shared/pos/PosToast";
import { useBranch } from "@/hooks/useBranch";
import { useAuth } from "@/hooks/useAuth";
import { useSaleCartResize } from "@/hooks/useSaleCartResize";
import { getCustomer } from "@/apis/customer.api";
import { useOrderReceipt } from "@/hooks/useOrders";
import { useCheckout } from "@/hooks/usePos";
import {
  calcNetTotal,
  getLineDiscount,
  getLineFinalPrice,
  getUnitPrice,
  type CartLine,
} from "@/lib/cart";
import { formatDateTime, formatMoney, toMoney, todayISO } from "@/lib/format";
import { getOrderNetTotal } from "@/lib/order";
import {
  clearPersistedCart,
  createDraftId,
  loadDrafts,
  loadPersistedCart,
  persistCart,
  saveDrafts,
  SALE_CLEAR_CART_EVENT,
  tryAddToCart,
  type SaleDraft,
} from "@/lib/sale";
import type { OrderDetail, PosProduct } from "@/types/api";
import {
  getCheckoutSchema,
  validatePaidAmount,
  type CheckoutFormValues,
} from "@/validation/checkout.validation";
import { cn } from "@/lib/utils";

const CART_PERSIST_DEBOUNCE_MS = 200;

export function SalePage() {
  const { t } = useTranslation();
  const { canRestock, currentBranchId } = useBranch();
  const { canWrite } = useAuth();
  const { toasts, showToast, dismiss } = usePosToast();
  const {
    saleLayoutRef,
    cartColumnRef,
    cartHeaderRef,
    cartListRef,
    listHeightPx,
    listRatio,
    cartWidthPx,
    widthRatio,
    minListRatio,
    maxListRatio,
    minWidthRatio,
    maxWidthRatio,
    startListResize,
    startWidthResize,
  } = useSaleCartResize();
  const [cart, setCart] = useState<CartLine[]>(() => loadPersistedCart());
  const cartRef = useRef(cart);
  cartRef.current = cart;
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<SaleDraft[]>(() => loadDrafts());
  const [draftsOpen, setDraftsOpen] = useState(false);
  const [restockOpen, setRestockOpen] = useState(false);
  const [mobileView, setMobileView] = useState<"products" | "cart">("products");
  const [completedOrder, setCompletedOrder] = useState<OrderDetail | null>(
    null,
  );
  const [selectedCustomerName, setSelectedCustomerName] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      persistCart(cart);
    }, CART_PERSIST_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [cart]);

  useEffect(() => {
    saveDrafts(drafts);
  }, [drafts]);

  useEffect(() => {
    function handleClearCartEvent() {
      cartRef.current = [];
      setCart([]);
      clearPersistedCart();
      showToast("info", t("pos.sale.cartCleared"));
    }
    window.addEventListener(SALE_CLEAR_CART_EVENT, handleClearCartEvent);
    return () => {
      window.removeEventListener(SALE_CLEAR_CART_EVENT, handleClearCartEvent);
    };
  }, [t, showToast]);

  const checkoutMutation = useCheckout();
  const checkoutSchema = useMemo(() => getCheckoutSchema(t), [t]);

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customerId: "",
      status: "COMPLETED",
      paymentType: "CASH",
      paidAmount: 0,
      orderDiscount: 0,
      deliveryFee: 0,
      orderDate: todayISO(),
      notes: "",
    },
  });

  const addProductToCart = useCallback(
    (product: PosProduct) => {
      if (!canWrite) {
        showToast("info", t("pos.sale.readOnlyCheckout"));
        return;
      }
      const { lines, result } = tryAddToCart(cartRef.current, product);
      cartRef.current = lines;
      setCart(lines);

      if (result === "max_stock") {
        showToast(
          "warning",
          t("pos.sale.maxStockReached", { name: product.name }),
        );
      }
    },
    [canWrite, t, showToast],
  );

  const handleRestockOpen = useCallback(() => {
    setRestockOpen(true);
  }, []);

  const handleCustomerChange = useCallback(
    (customer: { name: string } | undefined) => {
      setSelectedCustomerName(customer?.name ?? "");
    },
    [],
  );

  function updateQty(productId: string, delta: number) {
    let maxStockProductName: string | null = null;
    const nextCart = cartRef.current
      .map((line) => {
        if (line.product.productId !== productId) return line;
        const nextQty = line.quantity + delta;
        if (nextQty <= 0) return null;
        if (nextQty > line.product.stockQty) {
          maxStockProductName = line.product.name;
          return line;
        }
        return { ...line, quantity: nextQty };
      })
      .filter(Boolean) as CartLine[];

    cartRef.current = nextCart;
    setCart(nextCart);

    if (maxStockProductName) {
      showToast(
        "warning",
        t("pos.sale.maxStockReached", { name: maxStockProductName }),
      );
    }
  }

  function removeLine(productId: string) {
    const nextCart = cartRef.current.filter(
      (line) => line.product.productId !== productId,
    );
    cartRef.current = nextCart;
    setCart(nextCart);
  }

  function handleClearCart() {
    cartRef.current = [];
    setCart([]);
    clearPersistedCart();
    showToast("info", t("pos.sale.cartCleared"));
  }

  function handleSaveLineEdit(
    productId: string,
    patch: { quantity: number; unitPrice: number; discount: number },
  ) {
    const nextCart = cartRef.current.map((line) =>
      line.product.productId === productId
        ? {
            ...line,
            quantity: patch.quantity,
            unitPrice: patch.unitPrice,
            discount: patch.discount,
          }
        : line,
    );
    cartRef.current = nextCart;
    setCart(nextCart);
    setEditingProductId(null);
  }

  const editingLine = useMemo(
    () => cart.find((line) => line.product.productId === editingProductId) ?? null,
    [cart, editingProductId],
  );

  function buildDraftFromCurrent(): SaleDraft | null {
    if (cartRef.current.length === 0) return null;
    const values = form.getValues();
    const label =
      values.customerId && selectedCustomerName.trim()
        ? selectedCustomerName.trim()
        : t("pos.sale.draftLabel", {
            time: formatDateTime(new Date().toISOString()),
          });
    return {
      id: createDraftId(),
      label,
      createdAt: Date.now(),
      lines: cartRef.current,
      checkout: {
        customerId: values.customerId || "",
        status: values.status,
        paymentType: values.paymentType,
        paidAmount: values.paidAmount || 0,
        orderDiscount: values.orderDiscount || 0,
        deliveryFee: values.deliveryFee || 0,
        orderDate: values.orderDate || todayISO(),
        notes: values.notes?.trim() || "",
      },
    };
  }

  function resetCartAndForm() {
    cartRef.current = [];
    setCart([]);
    clearPersistedCart();
    form.reset({
      customerId: "",
      status: "COMPLETED",
      paymentType: "CASH",
      paidAmount: 0,
      orderDiscount: 0,
      deliveryFee: 0,
      orderDate: todayISO(),
      notes: "",
    });
    setSelectedCustomerName("");
  }

  function handleHoldOrder() {
    const draft = buildDraftFromCurrent();
    if (!draft) return;
    setDrafts((prev) => [draft, ...prev]);
    resetCartAndForm();
    showToast("success", t("pos.sale.held"));
  }

  function handleResumeDraft(id: string) {
    const draft = drafts.find((d) => d.id === id);
    if (!draft) return;

    const currentDraft = buildDraftFromCurrent();
    setDrafts((prev) => {
      const withoutResumed = prev.filter((d) => d.id !== id);
      return currentDraft ? [currentDraft, ...withoutResumed] : withoutResumed;
    });

    cartRef.current = draft.lines;
    setCart(draft.lines);
    form.reset({
      customerId: draft.checkout.customerId,
      status: draft.checkout.status ?? "COMPLETED",
      paymentType: draft.checkout.paymentType,
      paidAmount: draft.checkout.paidAmount,
      orderDiscount: draft.checkout.orderDiscount,
      deliveryFee: draft.checkout.deliveryFee || 0,
      orderDate: draft.checkout.orderDate || todayISO(),
      notes: draft.checkout.notes,
    });
    if (draft.checkout.customerId) {
      void getCustomer(draft.checkout.customerId, currentBranchId ?? undefined)
        .then((customer) => setSelectedCustomerName(customer.name))
        .catch(() => setSelectedCustomerName(""));
    } else {
      setSelectedCustomerName("");
    }
    setDraftsOpen(false);
    showToast("info", t("pos.sale.draftResumed"));
  }

  function handleDeleteDraft(id: string) {
    setDrafts((prev) => prev.filter((d) => d.id !== id));
    showToast("info", t("pos.sale.draftDeleted"));
  }

  const cartItemCount = useMemo(
    () => cart.reduce((sum, line) => sum + line.quantity, 0),
    [cart],
  );

  function onCheckout(values: CheckoutFormValues) {
    if (cart.length === 0) return;

    const netTotal = calcNetTotal(
      cart,
      values.orderDiscount || 0,
      values.deliveryFee || 0,
    );
    const paidError = validatePaidAmount(
      values.paidAmount,
      netTotal,
      values.customerId,
      t,
    );
    if (paidError) {
      form.setError(values.customerId ? "paidAmount" : "customerId", {
        type: "manual",
        message: paidError,
      });
      return;
    }

    const isFutureOrderDate = Boolean(
      values.orderDate && values.orderDate > todayISO(),
    );
    checkoutMutation.mutate(
      {
        customerId: values.customerId || null,
        items: cart.map((line) => ({
          productId: line.product.productId,
          quantity: line.quantity,
          unitPrice: toMoney(getUnitPrice(line)) || getLineFinalPrice(line),
          discount: toMoney(getLineDiscount(line)),
        })),
        status: isFutureOrderDate ? "COMPLETED" : values.status,
        paymentType: values.paymentType,
        paidAmount: values.paidAmount,
        orderDiscount: values.orderDiscount || 0,
        deliveryFee: values.deliveryFee || 0,
        orderDate: values.orderDate || todayISO(),
        notes: values.notes?.trim() || null,
      },
      {
        onSuccess: (order) => {
          setCompletedOrder(order);
          cartRef.current = [];
          setCart([]);
          clearPersistedCart();
          form.reset({
            customerId: "",
            status: "COMPLETED",
            paymentType: "CASH",
            paidAmount: 0,
            orderDiscount: 0,
            deliveryFee: 0,
            orderDate: todayISO(),
            notes: "",
          });
        },
      },
    );
  }

  if (completedOrder) {
    return (
      <SaleSuccessScreen
        order={completedOrder}
        onNewSale={() => setCompletedOrder(null)}
      />
    );
  }

  return (
    <>
      <PosPageShell
        ref={saleLayoutRef}
        fullHeight
        className="flex h-full min-h-0 flex-col overflow-hidden lg:flex-row"
      >
        <div className="flex shrink-0 gap-1 border-b border-border bg-card p-2 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileView("products")}
            className={cn(
              "flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
              mobileView === "products"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            {t("pos.sale.tabProducts")}
          </button>
          <button
            type="button"
            onClick={() => setMobileView("cart")}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
              mobileView === "cart"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            {t("pos.sale.cart")}
            {cartItemCount > 0 && (
              <span
                className={cn(
                  "inline-flex min-w-4 items-center justify-center rounded-full px-1 text-[11px] font-semibold leading-none",
                  mobileView === "cart"
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-primary text-primary-foreground",
                )}
              >
                {cartItemCount}
              </span>
            )}
          </button>
        </div>

        <div
          ref={cartColumnRef}
          className={cn(
            "min-h-0 w-full flex-col overflow-hidden border-b border-border bg-card lg:h-full lg:w-[var(--sale-cart-width)] lg:max-w-[var(--sale-cart-width)] lg:basis-[var(--sale-cart-width)] lg:shrink-0 lg:flex-col lg:border-b-0 lg:border-r",
            mobileView === "cart" ? "flex max-lg:flex-1" : "hidden lg:flex",
          )}
          style={
            {
              "--sale-cart-width":
                cartWidthPx > 0
                  ? `${cartWidthPx}px`
                  : `${Math.round(widthRatio * 100)}%`,
            } as React.CSSProperties
          }
        >
          <div
            ref={cartHeaderRef}
            className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border/60 px-4 py-2.5 sm:px-5"
          >
            <p className="min-w-0 truncate text-sm">
              <span className="font-medium text-foreground">
                {t("pos.sale.cart")}
              </span>
              <span className="text-muted-foreground">
                {" "}
                · {t("pos.sale.cartItems", { count: cartItemCount })}
              </span>
            </p>

            <div className="flex shrink-0 items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1.5"
                onClick={() => setDraftsOpen(true)}
              >
                <Layers className="size-3.5" />
                {t("pos.sale.drafts")}
                {drafts.length > 0 && (
                  <span className="ml-0.5 inline-flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-semibold leading-none text-primary-foreground">
                    {drafts.length}
                  </span>
                )}
              </Button>

              {cart.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5"
                  onClick={handleHoldOrder}
                >
                  <PauseCircle className="size-3.5" />
                  {t("pos.sale.hold")}
                </Button>
              )}

              {cart.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={handleClearCart}
                >
                  <Trash2 className="size-3.5" />
                  {t("pos.sale.clearCart")}
                </Button>
              )}
            </div>
          </div>

          <div
            ref={cartListRef}
            className={cn(
              "flex shrink-0 flex-col overflow-hidden px-4 py-3 sm:px-5",
              listHeightPx <= 0 && "min-h-0 flex-[0.58]",
            )}
            style={listHeightPx > 0 ? { height: listHeightPx } : undefined}
          >
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border/70 bg-card">
              {cart.length === 0 ? (
                <SaleCartEmpty />
              ) : (
                <>
                  <div
                    className="grid shrink-0 grid-cols-[minmax(0,1fr)_88px_72px_32px] items-center gap-2 border-b border-border/70 bg-muted/50 px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground sm:grid-cols-[minmax(0,1fr)_96px_80px_36px] sm:px-3.5"
                    role="row"
                  >
                    <span>{t("pos.stock.product")}</span>
                    <span className="text-center">{t("pos.stock.qty")}</span>
                    <span className="text-right">{t("pos.sale.total")}</span>
                    <span className="sr-only">{t("pos.common.delete")}</span>
                  </div>

                  <div className="min-h-0 flex-1 overflow-y-auto">
                    {cart.map((line) => (
                      <div
                        key={line.product.productId}
                        className="grid grid-cols-[minmax(0,1fr)_88px_72px_32px] items-center gap-2 border-b border-border/50 px-3 py-3 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_96px_80px_36px] sm:px-3.5"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setEditingProductId(line.product.productId)
                          }
                          className="group flex min-w-0 items-center gap-1.5 rounded-md py-0.5 pr-1 text-left transition-colors hover:text-primary"
                          title={t("pos.sale.editItem")}
                        >
                          <span className="min-w-0">
                            <span className="flex items-center gap-1">
                              <span className="truncate text-sm font-medium text-foreground group-hover:text-primary">
                                {line.product.name}
                              </span>
                              <Pencil className="size-3 shrink-0 text-muted-foreground/60 group-hover:text-primary" />
                            </span>
                            <span className="mt-0.5 flex items-center gap-1.5 text-xs tabular-nums text-muted-foreground">
                              {formatMoney(getLineFinalPrice(line))}
                              {getLineDiscount(line) > 0 && (
                                <span className="text-[11px] text-muted-foreground/70 line-through">
                                  {formatMoney(getUnitPrice(line))}
                                </span>
                              )}
                            </span>
                          </span>
                        </button>

                        <div className="flex items-center justify-center gap-0.5">
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            className="size-7 rounded-md"
                            onClick={() =>
                              updateQty(line.product.productId, -1)
                            }
                          >
                            <Minus className="size-3" />
                          </Button>
                          <span className="min-w-7 text-center text-sm font-semibold tabular-nums">
                            {line.quantity}
                          </span>
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            className="size-7 rounded-md"
                            onClick={() =>
                              updateQty(line.product.productId, 1)
                            }
                          >
                            <Plus className="size-3" />
                          </Button>
                        </div>

                        <p className="text-right text-sm font-semibold tabular-nums">
                          {formatMoney(getLineFinalPrice(line) * line.quantity)}
                        </p>

                        <div className="flex justify-end">
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="size-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => removeLine(line.product.productId)}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <div
            role="separator"
            aria-orientation="horizontal"
            aria-valuemin={Math.round(minListRatio * 100)}
            aria-valuemax={Math.round(maxListRatio * 100)}
            aria-valuenow={Math.round(listRatio * 100)}
            aria-label={t("pos.sale.resizeCartList")}
            onPointerDown={startListResize}
            className="group flex h-2.5 shrink-0 cursor-ns-resize touch-none select-none items-center justify-center border-y border-border/60 bg-muted/20 hover:bg-muted/40 active:bg-muted/50"
          >
            <span className="h-1 w-10 rounded-full bg-border transition-colors group-hover:bg-muted-foreground/50" />
          </div>

          <SaleCheckoutPanel
            form={form}
            cart={cart}
            checkoutMutation={checkoutMutation}
            onSubmit={onCheckout}
            onCustomerChange={handleCustomerChange}
          />
        </div>

        <div
          role="separator"
          aria-orientation="vertical"
          aria-valuemin={Math.round(minWidthRatio * 100)}
          aria-valuemax={Math.round(maxWidthRatio * 100)}
          aria-valuenow={Math.round(widthRatio * 100)}
          aria-label={t("pos.sale.resizeCartWidth")}
          onPointerDown={startWidthResize}
          className="group hidden h-full w-2.5 shrink-0 cursor-ew-resize touch-none select-none items-center justify-center border-x border-border/60 bg-muted/20 hover:bg-muted/40 active:bg-muted/50 lg:flex"
        >
          <span className="h-10 w-1 rounded-full bg-border transition-colors group-hover:bg-muted-foreground/50" />
        </div>

        <SaleProductGrid
          canRestock={canRestock}
          onAddProduct={addProductToCart}
          onRestock={handleRestockOpen}
          className={
            mobileView === "products" ? "flex" : "hidden lg:flex"
          }
        />

        {mobileView === "products" && cart.length > 0 && (
          <SaleMobileCartBar
            cart={cart}
            form={form}
            cartItemCount={cartItemCount}
            onViewCart={() => setMobileView("cart")}
          />
        )}
      </PosPageShell>
      {editingLine && (
        <CartItemEditModal
          line={editingLine}
          onClose={() => setEditingProductId(null)}
          onSave={(patch) =>
            handleSaveLineEdit(editingLine.product.productId, patch)
          }
        />
      )}
      {draftsOpen && (
        <DraftsModal
          drafts={drafts}
          onClose={() => setDraftsOpen(false)}
          onResume={handleResumeDraft}
          onDelete={handleDeleteDraft}
        />
      )}
      {canRestock && restockOpen && (
        <RestockModal
          onClose={() => setRestockOpen(false)}
          onSuccess={() => showToast("success", t("pos.stock.restockSuccess"))}
        />
      )}
      <PosToaster toasts={toasts} onDismiss={dismiss} />
    </>
  );
}

function CartItemEditModal({
  line,
  onClose,
  onSave,
}: {
  line: CartLine;
  onClose: () => void;
  onSave: (patch: {
    quantity: number;
    unitPrice: number;
    discount: number;
  }) => void;
}) {
  const { t } = useTranslation();
  const maxQty = line.product.stockQty;
  const [quantity, setQuantity] = useState(String(line.quantity));
  const [unitPrice, setUnitPrice] = useState(String(getUnitPrice(line)));
  const [discount, setDiscount] = useState(String(getLineDiscount(line)));

  const qtyNum = Math.floor(Number(quantity));
  const priceNum = Number(unitPrice);
  const discountNum = Number(discount);

  const qtyError =
    !Number.isFinite(qtyNum) || qtyNum < 1
      ? t("pos.sale.editQtyMin")
      : qtyNum > maxQty
        ? t("pos.sale.maxStockReached", { name: line.product.name })
        : null;
  const priceError =
    !Number.isFinite(priceNum) || priceNum < 0
      ? t("pos.validation.minZero")
      : null;
  const discountError =
    !Number.isFinite(discountNum) || discountNum < 0
      ? t("pos.validation.minZero")
      : discountNum > priceNum
        ? t("pos.sale.editDiscountTooHigh")
        : null;

  const hasError = Boolean(qtyError || priceError || discountError);
  const lineTotal =
    Math.max(priceNum - discountNum, 0) * (qtyNum > 0 ? qtyNum : 0);

  function handleSubmit() {
    if (hasError) return;
    onSave({
      quantity: qtyNum,
      unitPrice: priceNum,
      discount: discountNum,
    });
  }

  return (
    <PosModal
      title={t("pos.sale.editItem")}
      description={line.product.name}
      onClose={onClose}
      closeLabel={t("pos.sale.cancel")}
    >
      <div className="mt-4 space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">
            {t("pos.sale.quantity")}
          </label>
          <Input
            type="number"
            min={1}
            max={maxQty}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            autoFocus
          />
          {qtyError && (
            <p className="text-xs font-medium text-destructive">{qtyError}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">
            {t("pos.sale.unitPrice")}
          </label>
          <Input
            type="number"
            min={0}
            value={unitPrice}
            onChange={(e) => setUnitPrice(e.target.value)}
          />
          {priceError && (
            <p className="text-xs font-medium text-destructive">{priceError}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">
            {t("pos.sale.itemDiscount")}
          </label>
          <Input
            type="number"
            min={0}
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
          />
          {discountError && (
            <p className="text-xs font-medium text-destructive">
              {discountError}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-sm">
          <span className="text-muted-foreground">{t("pos.sale.lineTotal")}</span>
          <span className="font-semibold tabular-nums">
            {formatMoney(lineTotal)}
          </span>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="outline" onClick={onClose}>
            {t("pos.sale.cancel")}
          </Button>
          <Button type="button" disabled={hasError} onClick={handleSubmit}>
            {t("pos.sale.save")}
          </Button>
        </div>
      </div>
    </PosModal>
  );
}

function DraftsModal({
  drafts,
  onClose,
  onResume,
  onDelete,
}: {
  drafts: SaleDraft[];
  onClose: () => void;
  onResume: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <PosModal
      title={t("pos.sale.drafts")}
      onClose={onClose}
      closeLabel={t("pos.sale.cancel")}
    >
      <div className="mt-4">
        {drafts.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border/70 px-4 py-10 text-center text-sm text-muted-foreground">
            {t("pos.sale.noDrafts")}
          </p>
        ) : (
          <ul className="space-y-2">
            {drafts.map((draft) => {
              const itemCount = draft.lines.reduce(
                (sum, line) => sum + line.quantity,
                0,
              );
              const total = calcNetTotal(
                draft.lines,
                draft.checkout.orderDiscount,
                draft.checkout.deliveryFee || 0,
              );
              return (
                <li
                  key={draft.id}
                  className="flex items-center gap-3 rounded-lg border border-border/70 bg-card px-3 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {draft.label}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {t("pos.sale.cartItems", { count: itemCount })} ·{" "}
                      {formatMoney(total)} ·{" "}
                      {formatDateTime(
                        new Date(draft.createdAt).toISOString(),
                      )}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 shrink-0"
                    onClick={() => onResume(draft.id)}
                  >
                    {t("pos.sale.resume")}
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="size-8 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => onDelete(draft.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </PosModal>
  );
}

function SaleCartEmpty() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-14 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl border border-border/70 bg-muted/40">
        <ShoppingCart
          className="size-6 text-muted-foreground"
          strokeWidth={1.75}
        />
      </div>
      <p className="mt-4 text-sm font-medium text-foreground">
        {t("pos.sale.emptyCart")}
      </p>
      <p className="mt-1.5 max-w-[220px] text-xs leading-relaxed text-muted-foreground">
        {t("pos.sale.emptyCartHint")}
      </p>
    </div>
  );
}

function SaleSuccessScreen({
  order,
  onNewSale,
}: {
  order: OrderDetail;
  onNewSale: () => void;
}) {
  const { t } = useTranslation();
  const receiptQuery = useOrderReceipt(order.id);
  const netTotal = getOrderNetTotal(order);
  const changeAmount = toMoney(order.payment?.changeAmount);

  return (
    <PosPageShell>
      <div className="mx-auto max-w-2xl">
        <PageHeader
          title={t("pos.sale.successTitle")}
          description={`${order.orderNumber} · ${order.invoiceNumber}`}
        />
        <div className="rounded-xl border border-border/70 bg-card p-6 shadow-card">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {t("pos.orders.orderId")}
              </span>
              <span className="font-semibold tabular-nums">
                {order.orderNumber}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {t("pos.orders.dailySerial")}
              </span>
              <span className="font-semibold tabular-nums">
                #{order.dailySerial ?? "-"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {t("pos.orders.invoice")}
              </span>
              <span className="font-medium">{order.invoiceNumber}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                {t("pos.orders.status")}
              </span>
              <OrderStatusBadge status={order.status} />
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("pos.sale.total")}</span>
              <span className="text-lg font-bold text-primary">
                {formatMoney(netTotal)}
              </span>
            </div>
            {changeAmount > 0 && (
              <div className="flex justify-between text-success-foreground">
                <span>{t("pos.sale.change")}</span>
                <span className="font-bold">{formatMoney(changeAmount)}</span>
              </div>
            )}
            {order.notes?.trim() && (
              <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
                <p className="text-xs font-semibold text-muted-foreground">
                  {t("pos.sale.orderNotes")}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
                  {order.notes}
                </p>
              </div>
            )}
          </div>

          {receiptQuery.isLoading && (
            <div className="mt-4">
              <LoadingState label={t("pos.common.loading")} />
            </div>
          )}

          {receiptQuery.data && (
            <div className="mt-4">
              <ReceiptTicket receipt={receiptQuery.data} />
            </div>
          )}

          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            <Button
              variant="outline"
              onClick={() => window.print()}
              disabled={!receiptQuery.data}
            >
              {t("pos.orders.print")}
            </Button>
            <Button onClick={onNewSale}>{t("pos.sale.newSale")}</Button>
          </div>
        </div>
      </div>
    </PosPageShell>
  );
}
