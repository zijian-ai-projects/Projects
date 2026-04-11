"use client";

import { getUiCopy } from "@/lib/ui-copy";
import type { SessionDiagnosis } from "@/lib/types";

type UiCopy = ReturnType<typeof getUiCopy>;

const CATEGORY_LABELS = {
  en: {
    auth: "Authentication",
    network: "Network",
    timeout: "Timeout",
    model: "Model",
    "endpoint-shape": "Incompatible endpoint",
    unknown: "Unknown"
  },
  "zh-CN": {
    auth: "鉴权",
    network: "网络",
    timeout: "超时",
    model: "模型",
    "endpoint-shape": "接口不兼容",
    unknown: "未知"
  }
} as const;

function getHeadline(diagnosis: SessionDiagnosis, copy: UiCopy) {
  return copy.sessionDiagnosisStageHeadlines[diagnosis.stage];
}

export function SessionDiagnosisPanel({
  diagnosis,
  copy
}: {
  diagnosis: SessionDiagnosis;
  copy: UiCopy;
}) {
  const stageLabel = copy.sessionStageLabels[diagnosis.stage];
  const language = copy.appTitle === "两仪决" ? "zh-CN" : "en";
  const categoryLabel = CATEGORY_LABELS[language][diagnosis.category];

  return (
    <section
      aria-label={copy.sessionDiagnosisTitle}
      className="rounded-3xl border border-black/10 bg-white p-5 shadow-[0_10px_28px_rgba(0,0,0,0.03)]"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/50">
            {copy.sessionDiagnosisTitle}
          </p>
          <h2 className="text-lg font-semibold text-ink">{getHeadline(diagnosis, copy)}</h2>
        </div>
        <span className="rounded-full border border-black/10 bg-black/[0.03] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-ink/70">
          {stageLabel}
        </span>
      </div>

      <div className="mt-4 space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink/45">
            {copy.sessionDiagnosisSummaryLabel}
          </p>
          <p className="mt-1 text-sm leading-6 text-ink/80">{diagnosis.summary}</p>
        </div>

        <dl className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-white/80 p-3">
            <dt className="text-xs uppercase tracking-[0.14em] text-ink/45">
              {copy.sessionDiagnosisStepLabel}
            </dt>
            <dd className="mt-1 text-sm font-medium text-ink">{diagnosis.failingStep}</dd>
          </div>
          <div className="rounded-2xl bg-white/80 p-3">
            <dt className="text-xs uppercase tracking-[0.14em] text-ink/45">
              {copy.sessionDiagnosisEndpointLabel}
            </dt>
            <dd className="mt-1 break-all text-sm font-medium text-ink">{diagnosis.providerBaseUrl}</dd>
          </div>
          <div className="rounded-2xl bg-white/80 p-3">
            <dt className="text-xs uppercase tracking-[0.14em] text-ink/45">
              {copy.sessionDiagnosisModelLabel}
            </dt>
            <dd className="mt-1 text-sm font-medium text-ink">{diagnosis.providerModel}</dd>
          </div>
          <div className="rounded-2xl bg-white/80 p-3">
            <dt className="text-xs uppercase tracking-[0.14em] text-ink/45">
              {copy.sessionDiagnosisCategoryLabel}
            </dt>
            <dd className="mt-1 text-sm font-medium text-ink">{categoryLabel}</dd>
          </div>
        </dl>

        {diagnosis.detail ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink/45">
              {copy.sessionDiagnosisDetailLabel}
            </p>
            <p className="mt-1 text-sm leading-6 text-ink/70">{diagnosis.detail}</p>
          </div>
        ) : null}

        <div className="rounded-2xl border border-black/10 bg-black/[0.02] p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink/45">
            {copy.sessionDiagnosisSuggestedFixLabel}
          </p>
          <p className="mt-1 text-sm leading-6 text-ink/80">{diagnosis.suggestedFix}</p>
        </div>
      </div>
    </section>
  );
}
