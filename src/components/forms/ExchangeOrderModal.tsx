import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { PosModal } from "@/components/shared/pos/PosModal";
import { CustomerCombobox } from "@/components/shared/pos/CustomerCombobox";
import { ProductCombobox } from "@/components/shared/pos/ProductCombobox";
import { formatMoney, toMoney } from "@/lib/format";
import {
  buildFinalOrderItems,
  computeOrderEditTotals,
  createExchangeCartFromOrder,
  hasExchangeChanges,
  type ExchangeCartLine,
} from "@/lib/exchange-order";
import { getOrderCustomerId, getOrderTotals } from "@/lib/order";
import type { ExchangeOrderInput, OrderDetail, PaymentType, PosProduct } from "@/types/api";
import { cn } from "@/lib/utils";

const PAYMENT_OPTIONS: PaymentType[] = [
  "CASH",
  "KBZPAY",
  "WAVEPAY",
  "CARD",
  "BANKING",
];

interface ExchangeOrderModalProps {
  order: OrderDetail;
  saving: boolean;
  onClose: () => void;
  onSubmit: (input: ExchangeOrderInput) => void;
}

export function ExchangeOrderModal({
  order,
  saving,
  onClose,
  onSubmit,
}: ExchangeOrderModalProps) {
  const { t } = useTranslation();
  const orderTotals = getOrderTotals(order);
  const [lines, setLines] = useState<ExchangeCartLine[]>(() =>
    createExchangeCartFromOrder(order),
  );
  const initialCustomerId = getOrderCustomerId(order);
  const [customerId, setCustomerId] = useState(initialCustomerId);
  const [pickerProductId, setPickerProductId] = useState("");
  const [pickerLabel, setPickerLabel] = useState("");
  const [paymentType, setPaymentType] = useState<PaymentType>(
    order.payments?.[0]?.paymentType ?? order.payment?.paymentType ?? "CASH",
  );
  const [paidAmount, setPaidAmount] = useState(
    String(toMoney(order.paidTotal ?? order.payments?.[0]?.paidAmount ?? 0)),
  );
  const [orderDiscount, setOrderDiscount] = useState(String(orderTotals.orderDiscount));
  const [deliveryFee, setDeliveryFee] = useState(String(orderTotals.deliveryFee));
  const [taxAmount, setTaxAmount] = useState(String(orderTotals.taxAmount));
  const [notes, setNotes] = useState(order.notes ?? "");
  const paidManuallyEdited = useRef(false);

  const orderDiscountNum = Number(orderDiscount) || 0;
  const deliveryFeeNum = Number(deliveryFee) || 0;
  const taxAmountNum = Number(taxAmount) || 0;
  const paidNum = Number(paidAmount) || 0;

  const finalItems = useMemo(() => buildFinalOrderItems(lines), [lines]);

  const settlement = useMemo(
    () =>
      computeOrderEditTotals(
        finalItems,
        orderDiscountNum,
        deliveryFeeNum,
        taxAmountNum,
      ),
    [finalItems, orderDiscountNum, deliveryFeeNum, taxAmountNum],
  );

  useEffect(() => {
    if (paidManuallyEdited.current) return;
    setPaidAmount(String(settlement.netTotal));
  }, [settlement.netTotal]);

  const changeAmount = Math.max(paidNum - settlement.netTotal, 0);
  const balanceDue = Math.max(settlement.netTotal - paidNum, 0);
  const isCreditSale = settlement.netTotal > 0 && paidNum < settlement.netTotal;

  const visibleLines = lines.filter(
    (line) => line.kind === "new" || !line.removed,
  );

  const formSnapshot = useMemo(
    () => ({
      customerId,
      orderDiscount: orderDiscountNum,
      deliveryFee: deliveryFeeNum,
      taxAmount: taxAmountNum,
      paidAmount: paidNum,
      notes,
    }),
    [customerId, orderDiscountNum, deliveryFeeNum, taxAmountNum, paidNum, notes],
  );

  const validationError = useMemo(() => {
    if (finalItems.length === 0) {
      return t("pos.orders.exchange.itemsRequired");
    }
    if (!hasExchangeChanges(order, lines, formSnapshot, paidManuallyEdited.current)) {
      return t("pos.orders.exchange.noChanges");
    }
    for (const line of lines) {
      if (line.kind !== "original" || line.removed) continue;
      if (line.quantity < 0) {
        return t("pos.orders.exchange.invalidReturnQty");
      }
      if (line.discount > line.unitPrice) {
        return t("pos.sale.editDiscountTooHigh");
      }
    }
    for (const line of lines) {
      if (line.kind !== "new") continue;
      if (line.quantity < 1) {
        return t("pos.sale.editQtyMin");
      }
      if (line.discount > line.unitPrice) {
        return t("pos.sale.editDiscountTooHigh");
      }
    }
    if (isCreditSale && !customerId) {
      return t("pos.orders.exchange.customerRequiredForCredit");
    }
    if (paidNum < 0) {
      return t("pos.orders.exchange.invalidPaidAmount");
    }
    return null;
  }, [
    order,
    lines,
    finalItems.length,
    formSnapshot,
    customerId,
    isCreditSale,
    paidNum,
    t,
  ]);

  function setPaidAmountManual(value: string) {
    paidManuallyEdited.current = true;
    setPaidAmount(value);
  }

  function adjustPaidAmount(delta: number) {
    paidManuallyEdited.current = true;
    setPaidAmount((prev) => {
      const next = Math.max(0, (Number(prev) || 0) + delta);
      return String(toMoney(next));
    });
  }

  function addProduct(productId: string, product: PosProduct) {
    if (!productId) return;

    const existingOriginal = lines.find(
      (line) =>
        line.kind === "original" &&
        !line.removed &&
        line.productId === productId,
    );
    if (existingOriginal) {
      updateLine(existingOriginal.key, { quantity: existingOriginal.quantity + 1 });
      setPickerProductId("");
      setPickerLabel("");
      return;
    }

    const existingNew = lines.find(
      (line) => line.kind === "new" && line.productId === productId,
    );
    if (existingNew) {
      updateLine(existingNew.key, { quantity: existingNew.quantity + 1 });
    } else {
      setLines((prev) => [
        ...prev,
        {
          kind: "new",
          key: `new-${productId}-${Date.now()}`,
          productId,
          productName: product.name,
          quantity: 1,
          unitPrice: toMoney(product.finalPrice),
          discount: 0,
        },
      ]);
    }
    setPickerProductId("");
    setPickerLabel("");
  }

  function updateLine(
    key: string,
    patch: {
      quantity?: number;
      unitPrice?: number;
      discount?: number;
      removed?: boolean;
    },
  ) {
    setLines((prev) =>
      prev.map((line) => (line.key === key ? { ...line, ...patch } : line)),
    );
  }

  function removeLine(key: string) {
    setLines((prev) =>
      prev
        .map((line) => {
          if (line.key !== key) return line;
          if (line.kind === "new") return null;
          return { ...line, removed: true, quantity: 0 };
        })
        .filter((line): line is ExchangeCartLine => line !== null),
    );
  }

  function handleSubmit() {
    if (validationError) return;
    onSubmit({
      items: finalItems,
      customerId: customerId || null,
      paymentType,
      paidAmount: paidNum,
      orderDiscount: orderDiscountNum,
      deliveryFee: deliveryFeeNum,
      taxAmount: taxAmountNum,
      notes: notes.trim() || null,
    });
  }

  return (
    <PosModal
      title={t("pos.orders.exchange.title")}
      description={order.invoiceNumber}
      onClose={onClose}
      closeLabel={t("pos.common.close")}
      wide
    >
      <div className="mt-4 space-y-6">
        <section className="space-y-2 rounded-xl border border-border/70 px-4 py-3">
          <label className="text-xs font-semibold text-muted-foreground">
            {t("pos.orders.customer")}
          </label>
          {order.customer?.name && initialCustomerId && (
            <p className="text-xs text-muted-foreground">
              {t("pos.orders.exchange.sourceCustomer", {
                name: order.customer.name,
              })}
            </p>
          )}
          <CustomerCombobox
            value={customerId}
            onChange={(nextCustomerId) => setCustomerId(nextCustomerId)}
            walkInLabel={t("pos.sale.walkIn")}
            placeholder={t("pos.members.searchPlaceholder")}
          />
        </section>

        <section className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-sm font-semibold text-foreground">
              {t("pos.orders.exchange.orderItems")}
            </h3>
            <p className="text-xs text-muted-foreground">
              {t("pos.orders.exchange.orderItemsHint")}
            </p>
          </div>

          {visibleLines.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border/70 px-4 py-6 text-center text-sm text-muted-foreground">
              {t("pos.orders.exchange.emptyItems")}
            </p>
          ) : (
            <ul className="divide-y divide-border/60 rounded-xl border border-border/70">
              {visibleLines.map((line) => (
                <li key={line.key} className="space-y-2 px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{line.productName}</p>
                      {line.kind === "original" && (
                        <p className="text-xs text-muted-foreground">
                          {t("pos.orders.exchange.originalQty", {
                            qty: line.originalQty,
                          })}
                        </p>
                      )}
                      {line.kind === "new" && (
                        <p className="text-xs font-medium text-primary">
                          {t("pos.orders.exchange.newBadge")}
                        </p>
                      )}
                    </div>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="size-8 shrink-0 text-destructive"
                      onClick={() => removeLine(line.key)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <div>
                      <label className="text-[11px] text-muted-foreground">
                        {t("pos.sale.quantity")}
                      </label>
                      <div className="mt-1 flex items-center gap-1">
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          className="size-8"
                          disabled={line.quantity <= (line.kind === "original" ? 0 : 1)}
                          onClick={() =>
                            updateLine(line.key, {
                              quantity: Math.max(
                                line.kind === "original" ? 0 : 1,
                                line.quantity - 1,
                              ),
                            })
                          }
                        >
                          <Minus className="size-3.5" />
                        </Button>
                        <Input
                          type="number"
                          min={line.kind === "original" ? 0 : 1}
                          value={line.quantity}
                          className="h-8 px-2 text-center"
                          onChange={(event) => {
                            const raw = Number(event.target.value);
                            const min = line.kind === "original" ? 0 : 1;
                            let next = Number.isFinite(raw) ? raw : min;
                            next = Math.max(min, next);
                            updateLine(line.key, { quantity: next });
                          }}
                        />
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          className="size-8"
                          onClick={() =>
                            updateLine(line.key, { quantity: line.quantity + 1 })
                          }
                        >
                          <Plus className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] text-muted-foreground">
                        {t("pos.sale.unitPrice")}
                      </label>
                      <Input
                        type="number"
                        min={0}
                        value={line.unitPrice}
                        onChange={(event) =>
                          updateLine(line.key, {
                            unitPrice: Math.max(0, Number(event.target.value) || 0),
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-muted-foreground">
                        {t("pos.sale.itemDiscount")}
                      </label>
                      <Input
                        type="number"
                        min={0}
                        value={line.discount}
                        onChange={(event) =>
                          updateLine(line.key, {
                            discount: Math.max(0, Number(event.target.value) || 0),
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-muted-foreground">
                        {t("pos.sale.lineTotal")}
                      </label>
                      <p className="flex h-10 items-center text-sm font-semibold tabular-nums">
                        {formatMoney(
                          Math.max(
                            line.quantity * line.unitPrice -
                              line.quantity * line.discount,
                            0,
                          ),
                        )}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <ProductCombobox
            value={pickerProductId}
            selectedLabel={pickerLabel}
            onChange={(productId, product) => {
              setPickerProductId(productId);
              setPickerLabel(product.name);
              addProduct(productId, product);
            }}
            placeholder={t("pos.orders.exchange.addProduct")}
          />
        </section>

        <section className="space-y-3 rounded-xl border border-border/70 px-4 py-3">
          <h3 className="text-sm font-semibold text-foreground">
            {t("pos.orders.exchange.settlement")}
          </h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <Field
              label={t("pos.sale.orderDiscount")}
              value={orderDiscount}
              onChange={setOrderDiscount}
            />
            <Field
              label={t("pos.orders.deliveryFee")}
              value={deliveryFee}
              onChange={setDeliveryFee}
            />
            <Field label={t("pos.orders.tax")} value={taxAmount} onChange={setTaxAmount} />
          </div>
          <div className="space-y-1 text-sm">
            <SettlementRow
              label={t("pos.sale.subtotal")}
              value={formatMoney(settlement.subtotal)}
            />
            {settlement.itemDiscount > 0 && (
              <SettlementRow
                label={t("pos.sale.itemDiscount")}
                value={`−${formatMoney(settlement.itemDiscount)}`}
              />
            )}
            <SettlementRow
              label={t("pos.orders.exchange.amountDue")}
              value={formatMoney(settlement.netTotal)}
              strong
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                {t("pos.sale.paymentType")}
              </label>
              <Select
                value={paymentType}
                onChange={(event) =>
                  setPaymentType(event.target.value as PaymentType)
                }
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
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="size-8 shrink-0"
                  disabled={paidNum <= 0}
                  onClick={() => adjustPaidAmount(-1)}
                >
                  <Minus className="size-3.5" />
                </Button>
                <Input
                  type="number"
                  min={0}
                  value={paidAmount}
                  className="h-8 text-center"
                  onChange={(event) => setPaidAmountManual(event.target.value)}
                />
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="size-8 shrink-0"
                  onClick={() => adjustPaidAmount(1)}
                >
                  <Plus className="size-3.5" />
                </Button>
              </div>
              {changeAmount > 0 && (
                <p className="text-xs text-muted-foreground">
                  {t("pos.sale.change")}: {formatMoney(changeAmount)}
                </p>
              )}
              {balanceDue > 0 && (
                <p className="text-xs font-medium text-destructive">
                  {t("pos.orders.balanceDue")}: {formatMoney(balanceDue)}
                </p>
              )}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">
              {t("pos.sale.orderNotes")}
            </label>
            <Input value={notes} onChange={(event) => setNotes(event.target.value)} />
          </div>
        </section>

        {validationError && (
          <p className="text-sm font-medium text-destructive">{validationError}</p>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            {t("pos.common.cancel")}
          </Button>
          <Button
            type="button"
            disabled={Boolean(validationError) || saving}
            onClick={handleSubmit}
          >
            {saving ? t("pos.common.loading") : t("pos.orders.exchange.submit")}
          </Button>
        </div>
      </div>
    </PosModal>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1">
      <label className="text-[11px] text-muted-foreground">{label}</label>
      <Input
        type="number"
        min={0}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function SettlementRow({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span
        className={cn("text-muted-foreground", strong && "font-semibold text-foreground")}
      >
        {label}
      </span>
      <span
        className={cn(
          "font-medium tabular-nums text-foreground",
          strong && "text-base font-bold text-primary",
        )}
      >
        {value}
      </span>
    </div>
  );
}
