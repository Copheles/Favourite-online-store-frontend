import "./receipt-print.css";

import { useMemo, type CSSProperties } from "react";
import { formatMoney, toMoney } from "@/lib/format";
import { getOrderCashierName } from "@/lib/order";
import type { OrderReceipt } from "@/types/api";
import {
  RECEIPT_FOOTER_LINE,
  RECEIPT_LOGO_SRC,
  RECEIPT_POLICY_MY,
} from "@/components/receipt/receiptCopy";
import { ReceiptPrintStyle } from "@/components/receipt/ReceiptPrintStyle";
import { useReceiptPrintSettings } from "@/hooks/useReceiptPrintSettings";
import { cn } from "@/lib/utils";

type ReceiptTicketProps = {
  receipt: OrderReceipt;
  className?: string;
  /** When true, wraps with #receipt-print for window.print isolation */
  printRoot?: boolean;
};

/** Paper voucher style: `17:34 18-07-26` */
function formatReceiptDateTime(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "-";
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = String(d.getFullYear()).slice(-2);
  return `${hh}:${mm} ${day}-${month}-${year}`;
}

function unitAfterDiscount(item: OrderReceipt["items"][number]): number {
  if (item.unitPriceAfterDiscount != null) {
    return toMoney(item.unitPriceAfterDiscount);
  }
  if (item.quantity > 0) {
    return toMoney(toMoney(item.totalAmount) / item.quantity);
  }
  return Math.max(toMoney(item.unitPrice) - toMoney(item.discount), 0);
}

export function ReceiptTicket({
  receipt,
  className,
  printRoot = true,
}: ReceiptTicketProps) {
  const { paperWidthMm, isA4 } = useReceiptPrintSettings();
  const printTime = useMemo(
    () => new Date(),
    [receipt.invoiceNumber, receipt.orderNumber, receipt.orderId],
  );

  const totals = receipt.totals;
  const payment = receipt.payments?.[0];
  const qtySum = receipt.items.reduce((sum, item) => sum + item.quantity, 0);
  const amountSum = receipt.items.reduce(
    (sum, item) => sum + toMoney(item.totalAmount),
    0,
  );
  const deliveryFee = toMoney(totals.deliveryFee);

  const orderIdDisplay = receipt.orderNumber ?? receipt.orderId;
  const invoiceDisplay = receipt.invoiceNumber;
  const phoneLine = (receipt.shopInfo.phone ?? "").trim();
  const receiptStyle = {
    "--receipt-paper-width": `${paperWidthMm}mm`,
    maxWidth: isA4 ? "100%" : `${paperWidthMm}mm`,
  } as CSSProperties;

  const body = (
    <div className={cn("receipt-ticket", className)} style={receiptStyle}>
      <header className="receipt-header">
        <img
          src={RECEIPT_LOGO_SRC}
          alt=""
          className="receipt-logo"
          width={64}
          height={64}
        />
        <div className="receipt-shop-block">
          <p className="receipt-shop-name">{receipt.shopInfo.name}</p>
          {receipt.shopInfo.address && (
            <p className="receipt-shop-line">{receipt.shopInfo.address}</p>
          )}
          {phoneLine ? (
            <p className="receipt-shop-line">Tel : {phoneLine}</p>
          ) : null}
        </div>
      </header>

      <div className="receipt-divider" />

      <div className="receipt-meta">
        <div className="receipt-meta-pair">
          <span className="receipt-meta-cell">
            ID : {orderIdDisplay}
          </span>
          <span className="receipt-meta-cell receipt-meta-right">
            Invoice No : {invoiceDisplay}
          </span>
        </div>
        <div className="receipt-meta-pair">
          <span className="receipt-meta-cell">
            Print : {formatReceiptDateTime(printTime)}
          </span>
          <span className="receipt-meta-cell receipt-meta-right">
            Cashier : {getOrderCashierName(receipt.cashier)}
          </span>
        </div>
        <div className="receipt-meta-pair">
          <span className="receipt-meta-cell">
            Customer : {receipt.customer.name}
          </span>
          {receipt.customer.phone ? (
            <span className="receipt-meta-cell receipt-meta-right">
              Tel : {receipt.customer.phone}
            </span>
          ) : null}
        </div>
        <div className="receipt-meta-pair receipt-meta-emphasis">
          <span className="receipt-order-time">
            {formatReceiptDateTime(receipt.date)}
          </span>
          <span className="receipt-serial">{receipt.dailySerial ?? "-"}</span>
        </div>
      </div>

      <div className="receipt-divider" />

      <table className="receipt-items">
        <thead>
          <tr>
            <th className="col-name">Name</th>
            <th className="col-qty">Qty</th>
            <th className="col-price">Price</th>
            <th className="col-amount">Amount</th>
          </tr>
        </thead>
        <tbody>
          {receipt.items.map((item, idx) => (
            <tr key={idx}>
              <td className="col-name">{item.productName}</td>
              <td className="col-qty">{item.quantity}</td>
              <td className="col-price">{formatMoney(unitAfterDiscount(item))}</td>
              <td className="col-amount">{formatMoney(item.totalAmount)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="receipt-divider" />

      <table className="receipt-items receipt-totals-table">
        <tbody>
          {deliveryFee > 0 && (
            <tr>
              <td className="col-name">Delivery :</td>
              <td className="col-qty" />
              <td className="col-price" />
              <td className="col-amount">{formatMoney(deliveryFee)}</td>
            </tr>
          )}
          <tr>
            <td className="col-name">Total :</td>
            <td className="col-qty">{qtySum}</td>
            <td className="col-price" />
            <td className="col-amount">{formatMoney(amountSum)}</td>
          </tr>
        </tbody>
      </table>

      <div className="receipt-divider" />

      <div className="receipt-pay-block">
        <div className="receipt-total-row strong">
          <span>Net Total :</span>
          <span>{formatMoney(totals.netTotal)}</span>
        </div>
        {payment && (
          <>
            <div className="receipt-total-row">
              <span>Pay Amount :</span>
              <span>{formatMoney(payment.paidAmount)}</span>
            </div>
            <div className="receipt-total-row">
              <span>Change :</span>
              <span>{formatMoney(payment.changeAmount)}</span>
            </div>
          </>
        )}
      </div>

      <div className="receipt-divider" />

      <p className="receipt-policy">{RECEIPT_POLICY_MY}</p>

      <p className="receipt-footer-line">{RECEIPT_FOOTER_LINE}</p>
    </div>
  );

  if (!printRoot) return body;

  return (
    <div
      id="receipt-print"
      className={cn("receipt-print-root", isA4 && "receipt-print-root--a4")}
      style={receiptStyle}
    >
      <ReceiptPrintStyle paperWidthMm={paperWidthMm} isA4={isA4} />
      {body}
    </div>
  );
}
