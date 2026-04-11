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

function formatAnalysisIssues(issues: string[], fallback: string) {
  return issues.length ? issues.join("；") : fallback;
}

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
                {turn.analysis ? (
                  <div className="mt-3 rounded-[8px] border border-black/8 bg-paper/70 p-3 text-sm leading-6 text-ink">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink/60">
                      {copy.turnAnalysisTitle}
                    </p>
                    <div className="mt-2 space-y-1">
                      <p>
                        {copy.factualIssuesLabel}：{formatAnalysisIssues(turn.analysis.factualIssues, copy.noAnalysisIssues)}
                      </p>
                      <p>
                        {copy.logicalIssuesLabel}：{formatAnalysisIssues(turn.analysis.logicalIssues, copy.noAnalysisIssues)}
                      </p>
                      <p>
                        {copy.valueIssuesLabel}：{formatAnalysisIssues(turn.analysis.valueIssues, copy.noAnalysisIssues)}
                      </p>
                      <p>{copy.searchFocusLabel}：{turn.analysis.searchFocus}</p>
                    </div>
                  </div>
                ) : null}
                {turn.privateEvidenceIds?.length ? (
                  <div className="mt-3 rounded-[8px] border border-black/8 bg-paper/70 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink/60">
                      {copy.privateEvidenceTitle}
                    </p>
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {turn.privateEvidenceIds.map((evidenceId) => (
                        <li
                          key={`${turn.id}-private-${evidenceId}`}
                          className="rounded-full bg-white px-2.5 py-1 text-xs text-ink/70"
                          title={evidenceById.get(evidenceId)?.sourceName}
                        >
                          {turn.speaker}：{formatEvidenceReference(
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
                  </div>
                ) : null}
                <p className="mt-3 text-sm leading-6 text-ink">
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
