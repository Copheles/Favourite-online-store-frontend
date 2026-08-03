import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type DocSectionProps = {
  id: string;
  title: string;
  children: ReactNode;
  className?: string;
};

export function DocSection({ id, title, children, className }: DocSectionProps) {
  return (
    <section
      id={id}
      className={cn("scroll-mt-24 border-t border-border/60 pt-8 first:border-t-0 first:pt-0", className)}
    >
      <h3 className="text-base font-semibold tracking-tight text-card-foreground">{title}</h3>
      <div className="mt-3 space-y-4 text-sm text-muted-foreground">{children}</div>
    </section>
  );
}

type DocCalloutVariant = "info" | "tip" | "warning";

const calloutStyles: Record<DocCalloutVariant, string> = {
  info: "border-sky-300/40 bg-sky-50/60 dark:border-sky-800/40 dark:bg-sky-950/25",
  tip: "border-emerald-300/40 bg-emerald-50/60 dark:border-emerald-800/40 dark:bg-emerald-950/25",
  warning: "border-amber-300/40 bg-amber-50/60 dark:border-amber-800/40 dark:bg-amber-950/25",
};

type DocCalloutProps = {
  variant: DocCalloutVariant;
  title?: string;
  children: ReactNode;
};

export function DocCallout({ variant, title, children }: DocCalloutProps) {
  return (
    <div className={cn("rounded-xl border p-4 text-sm", calloutStyles[variant])}>
      {title ? (
        <p className="font-semibold text-foreground">{title}</p>
      ) : null}
      <div className={cn(title && "mt-1", "text-muted-foreground")}>{children}</div>
    </div>
  );
}

export type DocParamRow = {
  name: string;
  required: string;
  description: string;
  example: string;
};

type DocParamTableProps = {
  paramNameLabel: string;
  requiredLabel: string;
  descriptionLabel: string;
  exampleLabel: string;
  rows: DocParamRow[];
};

export function DocParamTable({
  paramNameLabel,
  requiredLabel,
  descriptionLabel,
  exampleLabel,
  rows,
}: DocParamTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border/70">
      <table className="min-w-full text-left text-xs sm:text-sm">
        <thead className="border-b border-border/70 bg-muted/30 text-foreground">
          <tr>
            <th className="px-3 py-2 font-semibold">{paramNameLabel}</th>
            <th className="px-3 py-2 font-semibold">{requiredLabel}</th>
            <th className="px-3 py-2 font-semibold">{descriptionLabel}</th>
            <th className="px-3 py-2 font-semibold">{exampleLabel}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name} className="border-b border-border/50 last:border-0">
              <td className="px-3 py-2 font-mono text-foreground">{row.name}</td>
              <td className="px-3 py-2">{row.required}</td>
              <td className="px-3 py-2">{row.description}</td>
              <td className="px-3 py-2 font-mono text-foreground">{row.example}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

type DocStepListProps = {
  steps: string[];
};

export function DocStepList({ steps }: DocStepListProps) {
  return (
    <ol className="space-y-3">
      {steps.map((step, index) => (
        <li key={index} className="flex gap-3">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
            {index + 1}
          </span>
          <span className="pt-0.5">{step}</span>
        </li>
      ))}
    </ol>
  );
}

type DocConfigTableProps = {
  fieldLabel: string;
  valueLabel: string;
  rows: { field: string; value: string }[];
};

export function DocConfigTable({ fieldLabel, valueLabel, rows }: DocConfigTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border/70">
      <table className="min-w-full text-left text-xs sm:text-sm">
        <thead className="border-b border-border/70 bg-muted/30 text-foreground">
          <tr>
            <th className="px-3 py-2 font-semibold">{fieldLabel}</th>
            <th className="px-3 py-2 font-semibold">{valueLabel}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.field} className="border-b border-border/50 last:border-0">
              <td className="px-3 py-2 font-medium text-foreground">{row.field}</td>
              <td className="px-3 py-2 font-mono text-[11px] text-foreground sm:text-xs">{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
