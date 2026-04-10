import type { DebateSummary, Evidence } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getUiCopy } from "@/lib/ui-copy";
import type { UiLanguage } from "@/lib/types";
import {
  buildEvidenceOrderMap,
  formatEvidenceReference,
  replaceEvidenceIdsInText
} from "@/lib/evidence-reference";

export function SummaryPanel({
  summary,
  evidence,
  language
}: {
  summary?: DebateSummary;
  evidence: Evidence[];
  language: UiLanguage;
}) {
  const copy = getUiCopy(language);
  const evidenceOrder = buildEvidenceOrderMap(evidence);

  if (!summary) {
    return (
      <Card
        aria-label={copy.summaryTitle}
        className="border-moss/20 bg-[#fcf8ef] p-6 shadow-[0_16px_40px_rgba(73,106,75,0.08)]"
      >
        <CardHeader className="space-y-2">
          <CardTitle className="text-xl">{copy.summaryTitle}</CardTitle>
          <p className="max-w-3xl text-sm leading-6 text-ink/68">{copy.summaryEmptyDescription}</p>
        </CardHeader>
        <CardContent>
          <p className="session-empty-state">{copy.summaryEmptyState}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      aria-label={copy.summaryTitle}
      className="border-moss/20 bg-[#fcf8ef] p-6 shadow-[0_16px_40px_rgba(73,106,75,0.08)]"
    >
      <CardHeader className="space-y-2">
        <CardTitle className="text-xl">{copy.summaryTitle}</CardTitle>
        <p className="max-w-3xl text-sm leading-6 text-ink/68">{copy.summaryDescription}</p>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <SummaryBlock
          title={copy.summaryStrongestFor}
          items={summary.strongestFor}
          copy={copy}
          evidenceOrder={evidenceOrder}
        />
        <SummaryBlock
          title={copy.summaryStrongestAgainst}
          items={summary.strongestAgainst}
          copy={copy}
          evidenceOrder={evidenceOrder}
        />
        <TextBlock
          title={copy.summaryCoreDisagreement}
          text={summary.coreDisagreement}
          copy={copy}
          evidenceOrder={evidenceOrder}
        />
        <TextBlock
          title={copy.summaryKeyUncertainty}
          text={summary.keyUncertainty}
          copy={copy}
          evidenceOrder={evidenceOrder}
        />
        <TextBlock
          title={copy.summaryNextAction}
          text={summary.nextAction}
          copy={copy}
          evidenceOrder={evidenceOrder}
        />
      </CardContent>
    </Card>
  );
}

function SummaryBlock({
  title,
  items,
  copy,
  evidenceOrder
}: {
  title: string;
  items: Array<{ text: string; evidenceIds: string[] }>;
  copy: ReturnType<typeof getUiCopy>;
  evidenceOrder: Map<string, number>;
}) {
  return (
    <section className="rounded-2xl border border-black/8 bg-white/88 p-4">
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      {items.length > 0 ? (
        <ul className="mt-3 space-y-3">
          {items.map((item, index) => (
            <li key={`${item.text}-${index}`} className="rounded-xl bg-paper/70 p-3">
              <p className="text-sm leading-6 text-ink/78">
                {replaceEvidenceIdsInText(item.text, evidenceOrder, copy.evidenceReferenceLabel)}
              </p>
              <p className="mt-2 text-xs uppercase tracking-[0.14em] text-ink/50">
                {item.evidenceIds.length > 0
                  ? `${copy.summaryEvidenceLabel}: ${item.evidenceIds
                      .map((evidenceId) =>
                        formatEvidenceReference(
                          evidenceId,
                          evidenceOrder,
                          copy.evidenceReferenceLabel
                        )
                      )
                      .join(", ")}`
                  : copy.summaryEvidenceNone}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm leading-6 text-ink/60">{copy.summaryNoItemsYet}</p>
      )}
    </section>
  );
}

function TextBlock({
  title,
  text,
  copy,
  evidenceOrder
}: {
  title: string;
  text: string;
  copy: ReturnType<typeof getUiCopy>;
  evidenceOrder: Map<string, number>;
}) {
  return (
    <section className="rounded-2xl border border-black/8 bg-white/88 p-4">
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-ink/72">
        {text
          ? replaceEvidenceIdsInText(text, evidenceOrder, copy.evidenceReferenceLabel)
          : copy.summaryNoContentYet}
      </p>
    </section>
  );
}
