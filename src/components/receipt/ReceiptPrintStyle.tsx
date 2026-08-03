type ReceiptPrintStyleProps = {
  paperWidthMm: number;
  isA4: boolean;
};

/**
 * `@page` size cannot read a CSS variable, so the rule is emitted at runtime
 * from the resolved paper width.
 */
export function ReceiptPrintStyle({
  paperWidthMm,
  isA4,
}: ReceiptPrintStyleProps) {
  const css = isA4
    ? `@media print {
  @page { size: A4 portrait; margin: 10mm; }
  #receipt-print { width: auto; max-width: 100%; }
}`
    : `@media print {
  @page { size: ${paperWidthMm}mm auto; margin: 0; }
  html, body { width: ${paperWidthMm}mm; }
  /* keep content off the head's unprintable edge */
  #receipt-print { padding: 2mm; }
}`;

  return <style>{css}</style>;
}
