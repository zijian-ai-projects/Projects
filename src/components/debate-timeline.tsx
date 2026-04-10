import type { DebateTurn, Evidence } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getUiCopy } from "@/lib/ui-copy";
import type { UiLanguage } from "@/lib/types";
import {
  buildEvidenceMap,
  buildEvidenceOrderMap,
  formatEvidenceReference,
  replaceEvidenceIdsInText
} from "@/lib/evidence-reference";

export function DebateTimeline({
  turns,
  evidence,
  language
}: {
  turns: DebateTurn[];
  evidence: Evidence[];
  language: UiLanguage;
}) {
  const copy = getUiCopy(language);
  const evidenceById = buildEvidenceMap(evidence);
  const evidenceOrder = buildEvidenceOrderMap(evidence);

  return (
    <Card aria-label={copy.debateTimelineTitle} className="h-full">
      <CardHeader>
        <CardTitle>{copy.debateTimelineTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        {turns.length === 0 ? (
          <p className="session-empty-state">{copy.debateTimelineEmptyState}</p>
        ) : (
          <ol className="space-y-4">
            {turns.map((turn, index) => (
              <li key={turn.id} className="rounded-2xl border border-black/8 bg-white/80 p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
                    {copy.turnLabel} {index + 1}
                  </span>
                  <span className="rounded-full bg-paper px-3 py-1 text-xs text-ink/70">
                    {turn.speaker}
                  </span>
                </div>
                <p className="text-sm leading-6 text-ink">
                  {replaceEvidenceIdsInText(turn.content, evidenceOrder, copy.evidenceReferenceLabel)}
                </p>
                {turn.referencedEvidenceIds.length > 0 ? (
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {turn.referencedEvidenceIds.map((evidenceId) => (
                      <li
                        key={`${turn.id}-${evidenceId}`}
                        className="rounded-full bg-paper px-2.5 py-1 text-xs text-ink/60"
                        title={evidenceById.get(evidenceId)?.sourceName}
                      >
                        {formatEvidenceReference(
                          evidenceId,
                          evidenceOrder,
                          copy.evidenceReferenceLabel
                        )}
                        {evidenceById.get(evidenceId)?.title
                          ? ` · ${evidenceById.get(evidenceId)?.title}`
                          : ""}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
