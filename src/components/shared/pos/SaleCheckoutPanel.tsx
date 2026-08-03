import { useEffect, useMemo } from "react";
import { useWatch, type UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { ShoppingCart } from "lucide-react";
import type { UseMutationResult } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { ApiErrorAlert } from "@/components/forms/ApiErrorAlert";
import { FormCustomerCombobox } from "@/components/forms/FormCustomerCombobox";
import { FormSelect } from "@/components/forms/FormSelect";
import { FormTextField } from "@/components/forms/FormTextField";
import { FormTextareaField } from "@/components/forms/FormTextareaField";
import { calcCartSubtotal, calcNetTotal, type CartLine } from "@/lib/cart";
import { formatMoney, toMoney, todayISO } from "@/lib/format";
import type { CheckoutFormValues } from "@/validation/checkout.validation";
import type { CheckoutInput, Customer, OrderDetail } from "@/types/api";
import { useAuth } from "@/hooks/useAuth";
import { useBranch } from "@/hooks/useBranch";

const PAYMENT_OPTIONS = [
  { value: "CASH", label: "CASH" },
  { value: "KBZPAY", label: "KBZPAY" },
  { value: "WAVEPAY", label: "WAVEPAY" },
  { value: "CARD", label: "CARD" },
  { value: "BANKING", label: "BANKING" },
];

const saleCheckoutControlClass =
  "h-8 text-xs lg:h-8 lg:text-xs xl:h-9 xl:text-sm";
const saleCheckoutLabelClass = "text-[11px] xl:text-xs";
const saleCheckoutTextareaClass =
  "min-h-[3.5rem] resize-none text-xs xl:min-h-[4.5rem] xl:text-sm";

type SaleCheckoutPanelProps = {
  form: UseFormReturn<CheckoutFormValues>;
  cart: CartLine[];
  checkoutMutation: UseMutationResult<
    OrderDetail,
    unknown,
    Omit<CheckoutInput, "branchId">
  >;
  onSubmit: (values: CheckoutFormValues) => void;
  onCustomerChange: (customer: Customer | undefined) => void;
};

export function SaleCheckoutPanel({
  form,
  cart,
  checkoutMutation,
  onSubmit,
  onCustomerChange,
}: SaleCheckoutPanelProps) {
  const { t } = useTranslation();
  const { canWrite, isAdmin } = useAuth();
  const { isDefaultBranch } = useBranch();
  const canCheckout =
    canWrite && (!isAdmin || isDefaultBranch);
  const orderDiscount = useWatch({ control: form.control, name: "orderDiscount" });
  const deliveryFee = useWatch({ control: form.control, name: "deliveryFee" });
  const paymentType = useWatch({ control: form.control, name: "paymentType" });
  const paidAmount = useWatch({ control: form.control, name: "paidAmount" });
  const customerId = useWatch({ control: form.control, name: "customerId" });
  const orderDate = useWatch({ control: form.control, name: "orderDate" });

  const subtotal = useMemo(() => calcCartSubtotal(cart), [cart]);
  const netTotal = useMemo(
    () =>
      calcNetTotal(
        cart,
        Number(orderDiscount) || 0,
        Number(deliveryFee) || 0,
      ),
    [cart, orderDiscount, deliveryFee],
  );

  const isFutureOrderDate = Boolean(orderDate && orderDate > todayISO());
  const effectivePaid = paidAmount > 0 ? paidAmount : netTotal;
  const changeAmount = Math.max(effectivePaid - netTotal, 0);
  const paidAmountValue = Math.max(Number(paidAmount) || 0, 0);
  const creditBalanceDue = Math.max(netTotal - paidAmountValue, 0);
  const isCreditSale =
    cart.length > 0 && netTotal > 0 && paidAmountValue < netTotal;
  const checkoutButtonLabel = isCreditSale
    ? `${t("pos.sale.saveCreditSale")} · ${formatMoney(creditBalanceDue)}`
    : `${t("pos.sale.checkout")} · ${formatMoney(netTotal)}`;

  useEffect(() => {
    if (isFutureOrderDate && form.getValues("status") !== "COMPLETED") {
      form.setValue("status", "COMPLETED", { shouldValidate: true });
    }
  }, [isFutureOrderDate, form]);

  useEffect(() => {
    if (paymentType !== "CASH" || netTotal <= 0) return;
    const nextPaid = toMoney(netTotal);
    if (form.getValues("paidAmount") === nextPaid) return;
    form.setValue("paidAmount", nextPaid, { shouldValidate: false });
  }, [netTotal, paymentType, form]);

  const statusOptions = [
    { value: "COMPLETED", label: t("pos.sale.statusCompleted") },
    { value: "PROCESSING", label: t("pos.sale.statusProcessing") },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden border-t border-border bg-card">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-3 sm:px-5 sm:py-4">
            <div className="grid gap-2 sm:grid-cols-2">
              <FormCustomerCombobox
                control={form.control}
                name="customerId"
                label={t("pos.sale.member")}
                walkInLabel={t("pos.sale.walkIn")}
                labelClassName={saleCheckoutLabelClass}
                controlClassName={saleCheckoutControlClass}
                onCustomerChange={onCustomerChange}
              />
              <FormSelect
                control={form.control}
                name="paymentType"
                label={t("pos.sale.paymentType")}
                options={PAYMENT_OPTIONS}
                size="sm"
                labelClassName={saleCheckoutLabelClass}
                controlClassName={saleCheckoutControlClass}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <FormTextField
                control={form.control}
                name="orderDate"
                label={t("pos.sale.orderDate")}
                type="date"
                min={todayISO()}
                labelClassName={saleCheckoutLabelClass}
                controlClassName={saleCheckoutControlClass}
              />
              <FormSelect
                control={form.control}
                name="status"
                label={t("pos.sale.orderStatus")}
                options={statusOptions}
                size="sm"
                disabled={isFutureOrderDate}
                labelClassName={saleCheckoutLabelClass}
                controlClassName={saleCheckoutControlClass}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <FormTextField
                control={form.control}
                name="paidAmount"
                label={t("pos.sale.paidAmount")}
                type="number"
                min={0}
                labelClassName={saleCheckoutLabelClass}
                controlClassName={saleCheckoutControlClass}
              />
              <FormTextField
                control={form.control}
                name="orderDiscount"
                label={t("pos.sale.orderDiscount")}
                type="number"
                min={0}
                labelClassName={saleCheckoutLabelClass}
                controlClassName={saleCheckoutControlClass}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <FormTextField
                control={form.control}
                name="deliveryFee"
                label={t("pos.sale.deliveryFee")}
                type="number"
                min={0}
                labelClassName={saleCheckoutLabelClass}
                controlClassName={saleCheckoutControlClass}
              />
            </div>

            <FormTextareaField
              control={form.control}
              name="notes"
              label={t("pos.sale.orderNotes")}
              placeholder={t("pos.sale.orderNotesPlaceholder")}
              rows={2}
              labelClassName={saleCheckoutLabelClass}
              controlClassName={saleCheckoutTextareaClass}
            />

            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-xs xl:text-sm">
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground">
                  {t("pos.sale.subtotal")}{" "}
                  <span className="font-medium text-foreground">
                    {formatMoney(subtotal)}
                  </span>
                </span>
                {Number(orderDiscount) > 0 && (
                  <span className="text-muted-foreground">
                    −{formatMoney(Number(orderDiscount) || 0)}
                  </span>
                )}
                {Number(deliveryFee) > 0 && (
                  <span className="text-muted-foreground">
                    +{formatMoney(Number(deliveryFee) || 0)}
                  </span>
                )}
              </div>
              {paymentType === "CASH" && changeAmount > 0 && (
                <span className="font-medium text-success-foreground">
                  {t("pos.sale.change")}: {formatMoney(changeAmount)}
                </span>
              )}
            </div>

            {isCreditSale && (
              <div className="rounded-lg border border-amber-300/70 bg-amber-50 px-3 py-2 text-xs text-amber-950 shadow-sm dark:border-amber-400/30 dark:bg-amber-950/30 dark:text-amber-100 xl:text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold">
                    {t("pos.sale.creditSale")}
                  </span>
                  <span className="font-bold tabular-nums">
                    {formatMoney(creditBalanceDue)}
                  </span>
                </div>
                <p className="mt-1 leading-relaxed">
                  {customerId
                    ? t("pos.sale.creditSaleHint", {
                        amount: formatMoney(creditBalanceDue),
                      })
                    : t("pos.sale.creditCustomerRequired")}
                </p>
              </div>
            )}
          </div>

          <div className="shrink-0 space-y-2 border-t border-border bg-card px-4 py-3 sm:px-5">
            <ApiErrorAlert
              error={checkoutMutation.error}
              fallback={t("pos.sale.checkoutError")}
            />

            <Button
              type="submit"
              className="h-9 w-full text-sm font-semibold xl:h-10"
              disabled={!canCheckout || cart.length === 0 || checkoutMutation.isPending}
            >
              {!canWrite
                ? t("pos.sale.readOnlyCheckout")
                : isAdmin && !isDefaultBranch
                  ? t("pos.sale.checkoutDefaultBranchOnly")
                : checkoutMutation.isPending
                  ? t("pos.sale.processing")
                  : checkoutButtonLabel}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

type SaleMobileCartBarProps = {
  cart: CartLine[];
  form: UseFormReturn<CheckoutFormValues>;
  cartItemCount: number;
  onViewCart: () => void;
};

export function SaleMobileCartBar({
  cart,
  form,
  cartItemCount,
  onViewCart,
}: SaleMobileCartBarProps) {
  const { t } = useTranslation();
  const orderDiscount = useWatch({ control: form.control, name: "orderDiscount" });
  const deliveryFee = useWatch({ control: form.control, name: "deliveryFee" });
  const netTotal = useMemo(
    () =>
      calcNetTotal(
        cart,
        Number(orderDiscount) || 0,
        Number(deliveryFee) || 0,
      ),
    [cart, orderDiscount, deliveryFee],
  );

  return (
    <div className="shrink-0 border-t border-border bg-card p-3 lg:hidden">
      <Button
        type="button"
        className="h-11 w-full justify-between text-sm font-semibold"
        onClick={onViewCart}
      >
        <span className="flex items-center gap-1.5">
          <ShoppingCart className="size-4" />
          {t("pos.sale.cartItems", { count: cartItemCount })}
        </span>
        <span className="flex items-center gap-1.5">
          {formatMoney(netTotal)}
          <span className="opacity-80">· {t("pos.sale.viewCart")}</span>
        </span>
      </Button>
    </div>
  );
}
