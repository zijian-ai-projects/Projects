"use client";

import { useEffect, useRef, useState } from "react";
import type { Evidence, ResearchPreviewItem } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getUiCopy } from "@/lib/ui-copy";
import type { UiLanguage } from "@/lib/types";
import { buildEvidenceOrderMap, formatEvidenceSourceUrl } from "@/lib/evidence-reference";

export function EvidencePanel({
  evidence,
  previewItems,
  language
}: {
  evidence: Evidence[];
  previewItems?: ResearchPreviewItem[];
  language: UiLanguage;
}) {
  const copy = getUiCopy(language);
  const hasEvidence = evidence.length > 0;
  const hasPreviewItems = Boolean(previewItems?.length) && !hasEvidence;
  const evidenceOrder = buildEvidenceOrderMap(evidence);
  const [expandedEvidenceId, setExpandedEvidenceId] = useState<string | null>(null);
  const expandedCardRef = useRef<HTMLLIElement | null>(null);
  const title = hasEvidence
    ? copy.sharedEvidenceTitle
    : hasPreviewItems
      ? copy.evidencePreviewTitle
      : copy.sharedEvidenceTitle;

  useEffect(() => {
    if (!expandedEvidenceId) {
      return;
    }

    if (!evidence.some((item) => item.id === expandedEvidenceId)) {
      setExpandedEvidenceId(null);
    }
  }, [evidence, expandedEvidenceId]);

  useEffect(() => {
    if (!expandedEvidenceId) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (expandedCardRef.current?.contains(event.target as Node)) {
        return;
      }

      setExpandedEvidenceId(null);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [expandedEvidenceId]);

  return (
    <Card aria-label={title} className="h-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {hasEvidence ? (
          <ul className="space-y-3">
            {evidence.map((item) => (
              <li
                key={item.id}
                ref={expandedEvidenceId === item.id ? expandedCardRef : null}
                className="rounded-2xl border border-black/8 bg-white/80"
              >
                <button
                  type="button"
                  className="w-full rounded-2xl px-4 py-4 text-left"
                  aria-expanded={expandedEvidenceId === item.id}
                  onClick={() =>
                    setExpandedEvidenceId((current) => (current === item.id ? null : item.id))
                  }
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-paper px-2.5 py-1 text-[11px] uppercase tracking-[0.16em] text-ink/60">
                      {copy.evidenceReferenceLabel} {evidenceOrder.get(item.id)}
                    </span>
                    <span className="rounded-full bg-paper px-2.5 py-1 text-[11px] uppercase tracking-[0.16em] text-ink/60">
                      {item.sourceType}
                    </span>
                  </div>
                  <h3 className="mt-3 text-sm font-semibold text-ink">{item.title}</h3>
                  <p
                    className="mt-2 max-w-full truncate text-xs text-ink/55"
                    title={formatEvidenceSourceUrl(item.url)}
                  >
                    {formatEvidenceSourceUrl(item.url)}
                  </p>
                </button>

                {expandedEvidenceId === item.id ? (
                  <div className="border-t border-black/8 px-4 pb-4 pt-4">
                    <p className="text-xs uppercase tracking-[0.15em] text-ink/50">
                      {item.sourceName}
                    </p>
                    <a
                      className="mt-2 inline-block text-sm text-ink underline decoration-black/15 underline-offset-4"
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {item.url}
                    </a>
                    <p className="mt-3 text-sm leading-6 text-ink/75">{item.summary}</p>
                    {item.dataPoints?.length ? (
                      <ul className="mt-3 list-disc space-y-1 pl-5 text-xs leading-5 text-ink/60">
                        {item.dataPoints.map((point) => (
                          <li key={point}>{point}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        ) : hasPreviewItems ? (
          <ul className="space-y-3">
            {(previewItems ?? []).map((item) => (
              <li
                key={`${item.sourceName}-${item.title}`}
                className="rounded-2xl border border-black/8 bg-white/80 p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold text-ink">{item.title}</h3>
                  <span className="rounded-full bg-paper px-2.5 py-1 text-[11px] uppercase tracking-[0.16em] text-ink/60">
                    {item.status === "found"
                      ? copy.evidencePreviewFound
                      : item.status === "read"
                        ? copy.evidencePreviewRead
                        : copy.evidencePreviewUsed}
                  </span>
                </div>
                <p className="mt-2 text-xs uppercase tracking-[0.15em] text-ink/50">
                  {item.sourceName}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="session-empty-state">{copy.evidencePanelEmptyState}</p>
        )}
      </CardContent>
    </Card>
  );
}
