import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Copy, KeyRound, RefreshCcw } from "lucide-react";

import {
  getOwnerIntegrationKeyMeta,
  regenerateOwnerIntegrationKey,
} from "@/apis/ownerIntegration.api";
import { getAccessibleBranches } from "@/apis/auth.api";
import { OwnerIntegrationTutorial } from "@/components/owner-integration/OwnerIntegrationTutorial";
import { ApiErrorAlert } from "@/components/forms/ApiErrorAlert";
import { PageHeader } from "@/components/shared/PageStates";
import { PosFilterTabs } from "@/components/shared/pos/PosFilterTabs";
import { PosPageShell } from "@/components/shared/pos/PosPageShell";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";

type OwnerIntegrationTab = "apiKey" | "tutorial";

const TAB_OPTIONS: readonly OwnerIntegrationTab[] = ["apiKey", "tutorial"];

function formatNullableDate(value: string | null, fallback: string): string {
  return value ? formatDateTime(value) : fallback;
}

function getApiBaseUrl(): string {
  return import.meta.env.VITE_API_URL?.trim() || "http://localhost:3000";
}

function buildCurl(urlPathAndQuery: string): string {
  const base = getApiBaseUrl();
  return `curl -X GET "${base}${urlPathAndQuery}" \\\n  -H "x-api-key: pos_owner_xxxxxxxxxxxxxxxx" \\\n  -H "Content-Type: application/json"`;
}

export function OwnerIntegrationPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<OwnerIntegrationTab>("apiKey");
  const [revealedApiKey, setRevealedApiKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const keyMetaQuery = useQuery({
    queryKey: ["owner-integration", "key-meta"],
    queryFn: getOwnerIntegrationKeyMeta,
  });

  const branchesQuery = useQuery({
    queryKey: ["owner-integration", "accessible-branches"],
    queryFn: () => getAccessibleBranches(),
  });

  const regenerateMutation = useMutation({
    mutationFn: regenerateOwnerIntegrationKey,
    onSuccess: (result) => {
      setRevealedApiKey(result.apiKey);
      setCopied(false);
      queryClient.setQueryData(["owner-integration", "key-meta"], result.meta);
    },
  });

  const keyMeta = keyMetaQuery.data;

  const keyStatusText = useMemo(() => {
    if (!keyMeta) return t("pos.common.loading");
    if (!keyMeta.hasKey) return t("pos.ownerIntegration.status.notGenerated");
    return keyMeta.isActive
      ? t("pos.ownerIntegration.status.active")
      : t("pos.ownerIntegration.status.inactive");
  }, [keyMeta, t]);

  const exampleBranchIds = useMemo(
    () => branchesQuery.data?.accessibleBranches.map((b) => b.id).slice(0, 3) ?? [],
    [branchesQuery.data],
  );

  const primaryBranchId = exampleBranchIds[0] ?? "<branch-id>";

  const salesCurl = useMemo(
    () =>
      buildCurl(
        `/api/integration/reports/sales?fromDate=2026-08-01&toDate=2026-08-03&branchId=${primaryBranchId}&page=1&limit=20`,
      ),
    [primaryBranchId],
  );
  const cashSummaryCurl = useMemo(
    () =>
      buildCurl(
        `/api/integration/reports/cash-summary?fromDate=2026-08-01&toDate=2026-08-03&branchId=${primaryBranchId}`,
      ),
    [primaryBranchId],
  );
  const inventoryCurl = useMemo(
    () =>
      buildCurl(
        `/api/integration/reports/inventory-balance?branchId=${primaryBranchId}&page=1&limit=20`,
      ),
    [primaryBranchId],
  );
  const summaryCurl = useMemo(
    () =>
      buildCurl(
        `/api/integration/reports/summary?fromDate=2026-08-01&toDate=2026-08-03&branchId=${primaryBranchId}`,
      ),
    [primaryBranchId],
  );

  const regenerate = () => {
    const ok = window.confirm(t("pos.ownerIntegration.confirmRotate"));
    if (!ok) return;
    regenerateMutation.mutate();
  };

  const copyKey = async () => {
    if (!revealedApiKey) return;
    await navigator.clipboard.writeText(revealedApiKey);
    setCopied(true);
  };

  return (
    <PosPageShell>
      <PageHeader
        title={t("pos.ownerIntegration.title")}
        description={t("pos.ownerIntegration.description")}
      />

      <PosFilterTabs
        value={activeTab}
        options={TAB_OPTIONS}
        onChange={setActiveTab}
        getLabel={(tab) =>
          tab === "apiKey"
            ? t("pos.ownerIntegration.tabApiKey")
            : t("pos.ownerIntegration.tabTutorial")
        }
        className="mb-1"
      />

      <div className="space-y-5">
        {activeTab === "apiKey" && (
        <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-card sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-card-foreground">
                {t("pos.ownerIntegration.keySectionTitle")}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("pos.ownerIntegration.keySectionDescription")}
              </p>
            </div>
            <div className="flex size-10 items-center justify-center rounded-lg bg-accent">
              <KeyRound className="size-5 text-accent-foreground" />
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-border/70 bg-background/60 p-3">
              <p className="text-xs text-muted-foreground">{t("pos.ownerIntegration.statusLabel")}</p>
              <p className="mt-1 text-sm font-medium">{keyStatusText}</p>
            </div>
            <div className="rounded-xl border border-border/70 bg-background/60 p-3">
              <p className="text-xs text-muted-foreground">{t("pos.ownerIntegration.prefixLabel")}</p>
              <p className="mt-1 text-sm font-medium">
                {keyMeta?.keyPrefix ?? t("pos.ownerIntegration.notAvailable")}
              </p>
            </div>
            <div className="rounded-xl border border-border/70 bg-background/60 p-3">
              <p className="text-xs text-muted-foreground">{t("pos.ownerIntegration.createdAtLabel")}</p>
              <p className="mt-1 text-sm font-medium">
                {formatNullableDate(keyMeta?.createdAt ?? null, t("pos.ownerIntegration.notAvailable"))}
              </p>
            </div>
            <div className="rounded-xl border border-border/70 bg-background/60 p-3">
              <p className="text-xs text-muted-foreground">{t("pos.ownerIntegration.lastUsedAtLabel")}</p>
              <p className="mt-1 text-sm font-medium">
                {formatNullableDate(keyMeta?.lastUsedAt ?? null, t("pos.ownerIntegration.neverUsed"))}
              </p>
            </div>
          </div>

          <ApiErrorAlert
            error={keyMetaQuery.error ?? regenerateMutation.error}
            fallback={t("pos.ownerIntegration.errorLoad")}
            className="mt-4"
          />

          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={regenerate}
              disabled={regenerateMutation.isPending}
            >
              <RefreshCcw className="mr-2 size-4" />
              {t("pos.ownerIntegration.regenerate")}
            </Button>
          </div>

          {revealedApiKey && (
            <div className="mt-4 rounded-xl border border-amber-300/40 bg-amber-50/70 p-4 dark:border-amber-700/30 dark:bg-amber-950/20">
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                {t("pos.ownerIntegration.keyGeneratedTitle")}
              </p>
              <p className="mt-1 text-xs text-amber-800 dark:text-amber-200">
                {t("pos.ownerIntegration.keyGeneratedWarning")}
              </p>
              <pre className="mt-3 overflow-x-auto rounded-md bg-black/85 px-3 py-2 text-xs text-emerald-300">
                {revealedApiKey}
              </pre>
              <Button type="button" variant="outline" className="mt-3" onClick={copyKey}>
                <Copy className="mr-2 size-4" />
                {copied
                  ? t("pos.ownerIntegration.copied")
                  : t("pos.ownerIntegration.copyKey")}
              </Button>
            </div>
          )}
        </section>
        )}

        {activeTab === "tutorial" && (
          <OwnerIntegrationTutorial
            apiBaseUrl={getApiBaseUrl()}
            exampleBranchIds={exampleBranchIds}
            primaryBranchId={primaryBranchId}
            salesCurl={salesCurl}
            cashSummaryCurl={cashSummaryCurl}
            inventoryCurl={inventoryCurl}
            summaryCurl={summaryCurl}
            onOpenApiKeyTab={() => setActiveTab("apiKey")}
          />
        )}
      </div>
    </PosPageShell>
  );
}
