import { useState } from "react";
import { Copy } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DocCodeBlockProps = {
  code: string;
  title?: string;
  className?: string;
};

export function DocCodeBlock({ code, title, className }: DocCodeBlockProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn("space-y-1.5", className)}>
      {title ? (
        <p className="text-xs font-semibold text-muted-foreground">{title}</p>
      ) : null}
      <div className="relative rounded-lg border border-border/60 bg-black/90">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-1 top-1 h-7 px-2 text-xs text-slate-300 hover:bg-white/10 hover:text-white"
          onClick={copy}
        >
          <Copy className="mr-1 size-3.5" />
          {copied
            ? t("pos.ownerIntegration.doc.copied")
            : t("pos.ownerIntegration.doc.copy")}
        </Button>
        <pre className="overflow-x-auto px-3 py-8 text-xs leading-relaxed text-slate-200 sm:py-3 sm:pr-24">
          {code}
        </pre>
      </div>
    </div>
  );
}
