import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { DocCodeBlock } from "@/components/owner-integration/DocCodeBlock";
import {
  DocCallout,
  DocConfigTable,
  DocParamTable,
  DocSection,
  DocStepList,
} from "@/components/owner-integration/doc-parts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TOC_IDS = [
  "overview",
  "prerequisites",
  "authentication",
  "endpoints",
  "n8n-setup",
  "n8n-output",
  "n8n-automation",
  "security",
] as const;

type TocId = (typeof TOC_IDS)[number];

type OwnerIntegrationTutorialProps = {
  apiBaseUrl: string;
  exampleBranchIds: string[];
  primaryBranchId: string;
  salesCurl: string;
  cashSummaryCurl: string;
  inventoryCurl: string;
  summaryCurl: string;
  onOpenApiKeyTab: () => void;
};

const HEADER_EXAMPLE = `x-api-key: pos_owner_xxxxxxxxxxxxxxxx
Content-Type: application/json`;

const SALES_RESPONSE_SAMPLE = `{
  "items": [ { "productName": "...", "netAmount": 0 } ],
  "summary": { "netAmount": 0, "estimatedProfit": 0 },
  "meta": { "total": 0, "page": 1, "limit": 20, "totalPages": 1 }
}`;

const INVENTORY_RESPONSE_SAMPLE = `{
  "items": [ { "productName": "...", "stockQty": 0 } ],
  "summary": { "totalProducts": 0, "totalStockQty": 0 },
  "meta": { "total": 0, "page": 1, "limit": 20, "totalPages": 1 }
}`;

const CASH_RESPONSE_SAMPLE = `{
  "netSalesTotal": 0,
  "orderCount": 0,
  "cashInHand": 0,
  "paymentSummary": [],
  "expenseSummary": []
}`;

export function OwnerIntegrationTutorial({
  apiBaseUrl,
  exampleBranchIds,
  primaryBranchId,
  salesCurl,
  cashSummaryCurl,
  inventoryCurl,
  summaryCurl,
  onOpenApiKeyTab,
}: OwnerIntegrationTutorialProps) {
  const { t } = useTranslation();

  const tocLabel = (id: TocId) => t(`pos.ownerIntegration.doc.toc.${id}`);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const tableLabels = useMemo(
    () => ({
      paramName: t("pos.ownerIntegration.doc.table.paramName"),
      required: t("pos.ownerIntegration.doc.table.required"),
      description: t("pos.ownerIntegration.doc.table.description"),
      example: t("pos.ownerIntegration.doc.table.example"),
      field: t("pos.ownerIntegration.doc.table.field"),
      value: t("pos.ownerIntegration.doc.table.value"),
      yes: t("pos.ownerIntegration.doc.table.yes"),
      no: t("pos.ownerIntegration.doc.table.no"),
    }),
    [t],
  );

  const sharedQueryParams = useMemo(
    () => [
      {
        name: "branchId",
        required: tableLabels.yes,
        description: t("pos.ownerIntegration.doc.params.branchId"),
        example: primaryBranchId,
      },
    ],
    [primaryBranchId, t, tableLabels.yes],
  );

  const dateParams = useMemo(
    () => [
      {
        name: "fromDate",
        required: tableLabels.yes,
        description: t("pos.ownerIntegration.doc.params.fromDate"),
        example: "2026-08-01",
      },
      {
        name: "toDate",
        required: tableLabels.yes,
        description: t("pos.ownerIntegration.doc.params.toDate"),
        example: "2026-08-03",
      },
    ],
    [t, tableLabels.yes],
  );

  const paginationParams = useMemo(
    () => [
      {
        name: "page",
        required: tableLabels.no,
        description: t("pos.ownerIntegration.doc.params.page"),
        example: "1",
      },
      {
        name: "limit",
        required: tableLabels.no,
        description: t("pos.ownerIntegration.doc.params.limit"),
        example: "20",
      },
    ],
    [t, tableLabels.no],
  );

  const salesExampleUrl = `${apiBaseUrl}/api/integration/reports/sales`;

  const n8nHttpRows = useMemo(
    () => [
      {
        field: t("pos.ownerIntegration.doc.n8n.httpRequestTable.method"),
        value: "GET",
      },
      {
        field: t("pos.ownerIntegration.doc.n8n.httpRequestTable.url"),
        value: salesExampleUrl,
      },
      {
        field: t("pos.ownerIntegration.doc.n8n.httpRequestTable.authentication"),
        value: t("pos.ownerIntegration.doc.n8n.httpRequestTable.authenticationValue"),
      },
      {
        field: t("pos.ownerIntegration.doc.n8n.httpRequestTable.sendQuery"),
        value: t("pos.ownerIntegration.doc.n8n.httpRequestTable.sendQueryValue"),
      },
      {
        field: t("pos.ownerIntegration.doc.n8n.httpRequestTable.queryParams"),
        value: `fromDate=2026-08-01, toDate=2026-08-03, branchId=${primaryBranchId}, page=1, limit=20`,
      },
      {
        field: t("pos.ownerIntegration.doc.n8n.httpRequestTable.sendHeaders"),
        value: t("pos.ownerIntegration.doc.n8n.httpRequestTable.sendHeadersValue"),
      },
      {
        field: t("pos.ownerIntegration.doc.n8n.httpRequestTable.headers"),
        value: "x-api-key: (your key), Content-Type: application/json",
      },
    ],
    [primaryBranchId, salesExampleUrl, t],
  );

  const setupSteps = [
    t("pos.ownerIntegration.doc.n8n.setupSteps.step1"),
    t("pos.ownerIntegration.doc.n8n.setupSteps.step2"),
    t("pos.ownerIntegration.doc.n8n.setupSteps.step3"),
    t("pos.ownerIntegration.doc.n8n.setupSteps.step4"),
    t("pos.ownerIntegration.doc.n8n.setupSteps.step5"),
  ];

  const outputSteps = [
    t("pos.ownerIntegration.doc.n8n.output.step1"),
    t("pos.ownerIntegration.doc.n8n.output.step2"),
    t("pos.ownerIntegration.doc.n8n.output.step3"),
  ];

  const automationSteps = [
    t("pos.ownerIntegration.doc.n8n.automation.step1"),
    t("pos.ownerIntegration.doc.n8n.automation.step2"),
    t("pos.ownerIntegration.doc.n8n.automation.step3"),
  ];

  return (
    <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-card sm:p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-card-foreground">
          {t("pos.ownerIntegration.guideTitle")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("pos.ownerIntegration.guideDescription")}
        </p>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <nav
          aria-label={t("pos.ownerIntegration.doc.tocTitle")}
          className="lg:sticky lg:top-24 lg:w-52 lg:shrink-0"
        >
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("pos.ownerIntegration.doc.tocTitle")}
          </p>
          <ul className="space-y-1 text-sm">
            {TOC_IDS.map((id) => (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => scrollTo(id)}
                  className={cn(
                    "w-full rounded-md px-2 py-1.5 text-left text-muted-foreground transition-colors",
                    "hover:bg-muted/50 hover:text-foreground",
                  )}
                >
                  {tocLabel(id)}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0 flex-1">
          <DocSection id="overview" title={t("pos.ownerIntegration.doc.overview.title")}>
            <p>{t("pos.ownerIntegration.doc.overview.body")}</p>
            <DocCallout variant="info" title={t("pos.ownerIntegration.doc.callout.readOnlyTitle")}>
              {t("pos.ownerIntegration.doc.callout.readOnlyBody")}
            </DocCallout>
          </DocSection>

          <DocSection id="prerequisites" title={t("pos.ownerIntegration.doc.prerequisites.title")}>
            <DocStepList
              steps={[
                t("pos.ownerIntegration.doc.prerequisites.step1"),
                t("pos.ownerIntegration.doc.prerequisites.step2"),
                t("pos.ownerIntegration.doc.prerequisites.step3"),
              ]}
            />
            <Button type="button" variant="outline" size="sm" onClick={onOpenApiKeyTab}>
              {t("pos.ownerIntegration.doc.prerequisites.openApiKeyTab")}
            </Button>
            {exampleBranchIds.length > 0 ? (
              <p>
                {t("pos.ownerIntegration.exampleBranchIds")}{" "}
                <span className="font-mono text-foreground">{exampleBranchIds.join(", ")}</span>
              </p>
            ) : (
              <DocCallout variant="warning">{t("pos.ownerIntegration.branchFallback")}</DocCallout>
            )}
          </DocSection>

          <DocSection id="authentication" title={t("pos.ownerIntegration.doc.authentication.title")}>
            <p>{t("pos.ownerIntegration.doc.authentication.body")}</p>
            <DocParamTable
              paramNameLabel={tableLabels.paramName}
              requiredLabel={tableLabels.required}
              descriptionLabel={tableLabels.description}
              exampleLabel={tableLabels.example}
              rows={[
                {
                  name: "x-api-key",
                  required: tableLabels.yes,
                  description: t("pos.ownerIntegration.doc.authentication.apiKeyHeader"),
                  example: "pos_owner_…",
                },
                {
                  name: "Content-Type",
                  required: tableLabels.no,
                  description: t("pos.ownerIntegration.doc.authentication.contentTypeHeader"),
                  example: "application/json",
                },
              ]}
            />
            <DocCodeBlock code={HEADER_EXAMPLE} title={t("pos.ownerIntegration.headersTitle")} />
          </DocSection>

          <DocSection id="endpoints" title={t("pos.ownerIntegration.doc.endpoints.title")}>
            <p>{t("pos.ownerIntegration.doc.endpoints.intro")}</p>

            <EndpointCard
              title={t("pos.ownerIntegration.doc.endpoints.sales.title")}
              description={t("pos.ownerIntegration.doc.endpoints.sales.description")}
              path="/api/integration/reports/sales"
              curl={salesCurl}
              tableLabels={tableLabels}
              rows={[...dateParams, ...sharedQueryParams, ...paginationParams]}
              responseHint={t("pos.ownerIntegration.doc.endpoints.sales.responseHint")}
              responseSample={SALES_RESPONSE_SAMPLE}
            />

            <EndpointCard
              title={t("pos.ownerIntegration.doc.endpoints.cashSummary.title")}
              description={t("pos.ownerIntegration.doc.endpoints.cashSummary.description")}
              path="/api/integration/reports/cash-summary"
              curl={cashSummaryCurl}
              tableLabels={tableLabels}
              rows={[...dateParams, ...sharedQueryParams]}
              responseHint={t("pos.ownerIntegration.doc.endpoints.cashSummary.responseHint")}
              responseSample={CASH_RESPONSE_SAMPLE}
            />

            <EndpointCard
              title={t("pos.ownerIntegration.doc.endpoints.inventory.title")}
              description={t("pos.ownerIntegration.doc.endpoints.inventory.description")}
              path="/api/integration/reports/inventory-balance"
              curl={inventoryCurl}
              tableLabels={tableLabels}
              rows={[...sharedQueryParams, ...paginationParams]}
              responseHint={t("pos.ownerIntegration.doc.endpoints.inventory.responseHint")}
              responseSample={INVENTORY_RESPONSE_SAMPLE}
            />

            <EndpointCard
              title={t("pos.ownerIntegration.doc.endpoints.summary.title")}
              description={t("pos.ownerIntegration.doc.endpoints.summary.description")}
              path="/api/integration/reports/summary"
              curl={summaryCurl}
              tableLabels={tableLabels}
              rows={[...dateParams, ...sharedQueryParams]}
              responseHint={t("pos.ownerIntegration.doc.endpoints.summary.responseHint")}
              responseSample={CASH_RESPONSE_SAMPLE}
            />
          </DocSection>

          <DocSection id="n8n-setup" title={t("pos.ownerIntegration.doc.n8n.setupTitle")}>
            <p>{t("pos.ownerIntegration.doc.n8n.setupIntro")}</p>
            <DocStepList steps={setupSteps} />
            <DocConfigTable
              fieldLabel={tableLabels.field}
              valueLabel={tableLabels.value}
              rows={n8nHttpRows}
            />
            <DocCallout variant="tip" title={t("pos.ownerIntegration.doc.callout.n8nTipTitle")}>
              {t("pos.ownerIntegration.doc.callout.n8nTipBody")}
            </DocCallout>
          </DocSection>

          <DocSection id="n8n-output" title={t("pos.ownerIntegration.doc.n8n.outputTitle")}>
            <DocStepList steps={outputSteps} />
            <p>{t("pos.ownerIntegration.doc.n8n.output.paginatedNote")}</p>
            <DocCodeBlock
              code={t("pos.ownerIntegration.doc.n8n.expressions.itemExample")}
              title={t("pos.ownerIntegration.doc.n8n.expressions.title")}
            />
            <DocCodeBlock code={t("pos.ownerIntegration.doc.n8n.expressions.summaryExample")} />
            <DocCodeBlock code={t("pos.ownerIntegration.doc.n8n.expressions.cashExample")} />
          </DocSection>

          <DocSection id="n8n-automation" title={t("pos.ownerIntegration.doc.n8n.automationTitle")}>
            <DocStepList steps={automationSteps} />
            <DocCodeBlock
              code={t("pos.ownerIntegration.doc.n8n.automation.sheetsExample")}
              title={t("pos.ownerIntegration.doc.n8n.automation.sheetsTitle")}
            />
            <DocCodeBlock
              code={t("pos.ownerIntegration.doc.n8n.automation.telegramExample")}
              title={t("pos.ownerIntegration.doc.n8n.automation.telegramTitle")}
            />
          </DocSection>

          <DocSection id="security" title={t("pos.ownerIntegration.securityTitle")}>
            <DocCallout variant="warning" title={t("pos.ownerIntegration.doc.callout.securityTitle")}>
              <ul className="list-disc space-y-1 pl-5">
                <li>{t("pos.ownerIntegration.securityNote1")}</li>
                <li>{t("pos.ownerIntegration.securityNote2")}</li>
              </ul>
            </DocCallout>
          </DocSection>
        </div>
      </div>
    </div>
  );
}

type EndpointCardProps = {
  title: string;
  description: string;
  path: string;
  curl: string;
  tableLabels: {
    paramName: string;
    required: string;
    description: string;
    example: string;
  };
  rows: {
    name: string;
    required: string;
    description: string;
    example: string;
  }[];
  responseHint: string;
  responseSample: string;
};

function EndpointCard({
  title,
  description,
  path,
  curl,
  tableLabels,
  rows,
  responseHint,
  responseSample,
}: EndpointCardProps) {
  return (
    <div className="rounded-xl border border-border/70 bg-background/40 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className="font-mono text-[10px] uppercase">
          GET
        </Badge>
        <span className="font-mono text-xs text-foreground">{path}</span>
      </div>
      <h4 className="mt-2 font-semibold text-foreground">{title}</h4>
      <p className="mt-1 text-sm">{description}</p>
      <div className="mt-3">
        <DocParamTable
          paramNameLabel={tableLabels.paramName}
          requiredLabel={tableLabels.required}
          descriptionLabel={tableLabels.description}
          exampleLabel={tableLabels.example}
          rows={rows}
        />
      </div>
      <DocCodeBlock className="mt-3" code={curl} title="cURL" />
      <p className="mt-3 text-xs">{responseHint}</p>
      <DocCodeBlock className="mt-2" code={responseSample} title="JSON" />
    </div>
  );
}
