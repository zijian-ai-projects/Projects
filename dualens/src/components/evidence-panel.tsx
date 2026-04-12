"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import type { Evidence, PrivateEvidencePools, ResearchPreviewItem } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getUiCopy } from "@/lib/ui-copy";
import type { UiLanguage } from "@/lib/types";
import { buildEvidenceOrderMap, formatEvidenceSourceUrl } from "@/lib/evidence-reference";
import { getEvidenceHolder } from "@/lib/evidence-ownership";

function readLocalFileText(file: File): Promise<string> {
  if (typeof file.text === "function") {
    return file.text();
  }

  if (typeof FileReader === "undefined") {
    return Promise.resolve("");
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener("load", () => {
      resolve(typeof reader.result === "string" ? reader.result : "");
    });
    reader.addEventListener("error", () => {
      reject(reader.error ?? new Error("Failed to read local evidence file"));
    });
    reader.readAsText(file);
  });
}

export function EvidencePanel({
  evidence,
  previewItems,
  privateEvidence,
  onUploadEvidence,
  language
}: {
  evidence: Evidence[];
  previewItems?: ResearchPreviewItem[];
  privateEvidence?: PrivateEvidencePools;
  onUploadEvidence?: (evidence: Evidence[]) => void;
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

  const buildLocalEvidence = async (file: File, index: number): Promise<Evidence> => {
    let text = "";

    try {
      text = (await readLocalFileText(file)).replace(/\s+/g, " ").trim();
    } catch {
      text = "";
    }

    return {
      id: `local-${Date.now()}-${index}-${file.name}`,
      title: file.name,
      url: `local:${file.name}`,
      sourceName: copy.localEvidenceSourceName,
      sourceType: language === "zh-CN" ? "本地" : "LOCAL",
      summary: text || `${copy.localEvidenceSummaryPrefix}：${file.name}`
    };
  };

  const handleLocalEvidenceUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length || !onUploadEvidence) {
      return;
    }

    const localEvidence = await Promise.all(files.map(buildLocalEvidence));
    onUploadEvidence(localEvidence);
    event.target.value = "";
  };

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
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <CardTitle>{title}</CardTitle>
        {onUploadEvidence ? (
          <label className="inline-flex cursor-pointer items-center justify-center rounded-[8px] border border-black/10 bg-white px-3 py-1.5 text-xs font-medium text-ink transition hover:border-black/20">
            <span>{copy.uploadLocalEvidence}</span>
            <input
              aria-label={copy.uploadLocalEvidence}
              className="sr-only"
              multiple
              type="file"
              onChange={handleLocalEvidenceUpload}
            />
          </label>
        ) : null}
      </CardHeader>
      <CardContent>
        {hasEvidence ? (
          <ul className="space-y-3">
            {evidence.map((item) => {
              const holder = getEvidenceHolder(item, privateEvidence);
              const isLocalEvidence = item.url.startsWith("local:");
              const sourceDisplay = isLocalEvidence
                ? item.sourceName
                : formatEvidenceSourceUrl(item.url);

              return (
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
                      {holder ? (
                        <span className="rounded-full bg-paper px-2.5 py-1 text-[11px] uppercase tracking-[0.16em] text-ink/60">
                          {copy.evidenceHolderLabels[holder]}
                        </span>
                      ) : null}
                    </div>
                    <h3 className="mt-3 text-sm font-semibold text-ink">{item.title}</h3>
                    <p
                      className="mt-2 max-w-full truncate text-xs text-ink/55"
                      title={sourceDisplay}
                    >
                      {sourceDisplay}
                    </p>
                  </button>

                  {expandedEvidenceId === item.id ? (
                    <div className="border-t border-black/8 px-4 pb-4 pt-4">
                      <p className="text-xs uppercase tracking-[0.15em] text-ink/50">
                        {item.sourceName}
                      </p>
                      {isLocalEvidence ? (
                        <p className="mt-2 text-sm text-ink/70">{item.title}</p>
                      ) : (
                        <a
                          className="mt-2 inline-block text-sm text-ink underline decoration-black/15 underline-offset-4"
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {item.url}
                        </a>
                      )}
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
              );
            })}
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
