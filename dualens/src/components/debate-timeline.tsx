"use client";

import { useState } from "react";
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

function getTurnRound(turn: DebateTurn, index: number) {
  return turn.round ?? Math.floor(index / 2) + 1;
}

function formatAnalysisIssues(issues: string[], fallback: string) {
  return issues.length ? issues.join("；") : fallback;
}

function formatAnalysisPreview(
  analysis: NonNullable<DebateTurn["analysis"]>,
  copy: ReturnType<typeof getUiCopy>
) {
  if (analysis.factualIssues[0]) {
    return `${copy.factualIssuesLabel}：${analysis.factualIssues[0]}`;
  }

  if (analysis.logicalIssues[0]) {
    return `${copy.logicalIssuesLabel}：${analysis.logicalIssues[0]}`;
  }

  if (analysis.valueIssues[0]) {
    return `${copy.valueIssuesLabel}：${analysis.valueIssues[0]}`;
  }

  return `${copy.searchFocusLabel}：${analysis.searchFocus}`;
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
  const [expandedAnalysisTurnId, setExpandedAnalysisTurnId] = useState<string | null>(null);
  const [expandedEvidenceTurnId, setExpandedEvidenceTurnId] = useState<string | null>(null);
  const formatTurnEvidencePreview = (evidenceId: string) => {
    const item = evidenceById.get(evidenceId);
    const reference = formatEvidenceReference(
      evidenceId,
      evidenceOrder,
      copy.evidenceReferenceLabel
    );

    return [reference, item?.title, item?.sourceName].filter(Boolean).join(" · ");
  };
  const formatTurnEvidenceDetail = (evidenceId: string) => {
    const item = evidenceById.get(evidenceId);
    const reference = formatEvidenceReference(
      evidenceId,
      evidenceOrder,
      copy.evidenceReferenceLabel
    );

    return [reference, item?.title, item?.sourceName].filter(Boolean).join(" · ");
  };

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
            {turns.map((turn, index) => {
              const round = getTurnRound(turn, index);
              const evidencePreviewItems = turn.referencedEvidenceIds
                .slice(0, 2)
                .map(formatTurnEvidencePreview);

              return (
                <li key={turn.id}>
                  <article
                    aria-label={`${copy.turnLabel} ${round} ${turn.speaker}`}
                    className="rounded-2xl border border-black/8 bg-white/80 p-4"
                  >
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-paper px-2.5 py-1 text-[11px] uppercase tracking-[0.16em] text-ink/60">
                        {copy.turnLabel} {round}
                      </span>
                      <span className="rounded-full border border-black/10 px-2.5 py-1 text-xs text-ink/70">
                        {turn.speaker}
                      </span>
                    </div>
                    {turn.analysis ? (
                      <div className="mb-3 rounded-[8px] border border-black/8 bg-paper/70">
                        <button
                          type="button"
                          aria-expanded={expandedAnalysisTurnId === turn.id}
                          className="w-full rounded-[8px] p-3 text-left text-sm leading-6"
                          onClick={() =>
                            setExpandedAnalysisTurnId((current) =>
                              current === turn.id ? null : turn.id
                            )
                          }
                        >
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink/60">
                            {copy.turnAnalysisTitle}
                          </p>
                          {expandedAnalysisTurnId === turn.id ? (
                            <div className="mt-2 space-y-1 text-ink">
                              <p>
                                {copy.factualIssuesLabel}：{formatAnalysisIssues(
                                  turn.analysis.factualIssues,
                                  copy.noAnalysisIssues
                                )}
                              </p>
                              <p>
                                {copy.logicalIssuesLabel}：{formatAnalysisIssues(
                                  turn.analysis.logicalIssues,
                                  copy.noAnalysisIssues
                                )}
                              </p>
                              <p>
                                {copy.valueIssuesLabel}：{formatAnalysisIssues(
                                  turn.analysis.valueIssues,
                                  copy.noAnalysisIssues
                                )}
                              </p>
                              <p>{copy.searchFocusLabel}：{turn.analysis.searchFocus}</p>
                            </div>
                          ) : (
                            <p className="mt-2 text-ink/75">
                              {formatAnalysisPreview(turn.analysis, copy)}
                            </p>
                          )}
                        </button>
                      </div>
                    ) : null}
                    <p className="text-sm leading-6 text-ink">
                      {replaceEvidenceIdsInText(
                        turn.content,
                        evidenceOrder,
                        copy.evidenceReferenceLabel
                      )}
                    </p>
                    {turn.referencedEvidenceIds.length ? (
                      <div className="mt-3 rounded-[8px] border border-black/8 bg-paper/70">
                        <button
                          type="button"
                          aria-expanded={expandedEvidenceTurnId === turn.id}
                          className="w-full rounded-[8px] p-3 text-left text-sm leading-6"
                          onClick={() =>
                            setExpandedEvidenceTurnId((current) =>
                              current === turn.id ? null : turn.id
                            )
                          }
                        >
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink/60">
                            {copy.turnEvidenceTitle}
                          </p>
                          <ul className="mt-2 space-y-1 text-ink/75">
                            {evidencePreviewItems.map((label) => (
                              <li key={`${turn.id}-preview-${label}`}>{label}</li>
                            ))}
                          </ul>
                        </button>
                        {expandedEvidenceTurnId === turn.id ? (
                          <ul className="space-y-2 border-t border-black/8 px-3 pb-3 pt-3">
                            {turn.referencedEvidenceIds.map((evidenceId) => {
                              const item = evidenceById.get(evidenceId);

                              return (
                                <li
                                  key={`${turn.id}-${evidenceId}`}
                                  className="rounded-[8px] bg-white/75 px-3 py-2 text-sm leading-6 text-ink"
                                >
                                  <p className="font-medium">
                                    {formatTurnEvidenceDetail(evidenceId)}
                                  </p>
                                  {item?.summary ? (
                                    <p className="mt-1 text-ink/70">{item.summary}</p>
                                  ) : null}
                                </li>
                              );
                            })}
                          </ul>
                        ) : null}
                      </div>
                    ) : null}
                  </article>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
