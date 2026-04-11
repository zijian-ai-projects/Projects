"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { HistoryCard } from "@/components/common/history-card";
import { PageHeader } from "@/components/common/page-header";
import { SectionCard } from "@/components/common/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useAppPreferences } from "@/lib/app-preferences";
import {
  deleteHistoryRecordFile,
  loadHistoryRecords,
  type HistoryListRecord
} from "@/lib/history-records";
import { useOptionalDebateWorkspaceState } from "@/lib/debate-workspace-state";
import { getWorkspaceCopy } from "@/lib/workspace-copy";

type HistoryLoadResult = Awaited<ReturnType<typeof loadHistoryRecords>>;

type HistoryPageContentProps = {
  loadRecords?: () => Promise<HistoryLoadResult>;
  deleteRecord?: typeof deleteHistoryRecordFile;
};

type HistoryCopy = ReturnType<typeof getWorkspaceCopy>["history"];

function getHistoryStatusLabel(record: HistoryListRecord, copy: HistoryCopy) {
  return {
    complete: copy.complete,
    running: copy.running,
    failed: copy.failed
  }[record.status];
}

function DialogShell({
  title,
  children,
  onClose
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/38 px-4 py-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="history-dialog-title"
        className="max-h-[88vh] w-full max-w-4xl overflow-y-auto rounded-[8px] border border-black/12 bg-white p-5 shadow-[0_24px_80px_rgba(0,0,0,0.22)]"
      >
        <div className="flex items-start justify-between gap-4 border-b border-black/8 pb-4">
          <h2 id="history-dialog-title" className="text-xl font-semibold text-app-strong">
            {title}
          </h2>
          <button
            type="button"
            aria-label="Close"
            className="inline-flex h-9 w-9 items-center justify-center rounded-[8px] border border-black/10 bg-white text-lg leading-none text-black"
            onClick={onClose}
          >
            x
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function HistoryRecordDetailsDialog({
  record,
  copy,
  onClose
}: {
  record: HistoryListRecord;
  copy: HistoryCopy;
  onClose: () => void;
}) {
  const evidenceTitleById = new Map(record.evidence.map((item) => [item.id, item.title]));
  const evidenceOrderById = new Map(record.evidence.map((item, index) => [item.id, index + 1]));

  return (
    <DialogShell title={copy.detailDialogTitle} onClose={onClose}>
      <div className="space-y-6 pt-5 text-sm leading-6 text-app-muted">
        <section className="space-y-2">
          <p className="text-base font-semibold text-app-strong">{record.question}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <p>{copy.createdAtPrefix}：{record.createdAt}</p>
            <p>{copy.statusPrefix}：{getHistoryStatusLabel(record, copy)}</p>
            <p>{copy.modelPrefix}：{record.model}</p>
            <p>{copy.searchEnginePrefix}：{record.searchEngine}</p>
            <p>{copy.rolePrefix}：{record.roleSummary}</p>
            <p>{copy.evidencePrefix}：{record.evidenceCount}</p>
            <p>{copy.turnPrefix}：{record.turnCount}</p>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-base font-semibold text-app-strong">{copy.evidenceSectionTitle}</h3>
          {record.evidence.length ? (
            <ol className="space-y-3">
              {record.evidence.map((item, index) => (
                <li key={item.id} className="rounded-[8px] border border-black/8 bg-black/[0.02] p-4">
                  <div className="text-xs uppercase tracking-[0.16em] text-app-muted">
                    {copy.evidencePrefix} {index + 1}
                  </div>
                  <h4 className="mt-2 text-sm font-semibold text-app-strong">{item.title}</h4>
                  <p className="mt-1">{item.sourceName} · {item.sourceType}</p>
                  <a
                    className="mt-1 block break-all text-app-strong underline decoration-black/20 underline-offset-4"
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {item.url}
                  </a>
                  <p className="mt-3 text-app-foreground">{item.summary}</p>
                  {item.dataPoints?.length ? (
                    <div className="mt-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-app-muted">
                        {copy.dataPointsTitle}
                      </p>
                      <ul className="mt-2 list-disc space-y-1 pl-5">
                        {item.dataPoints.map((point) => (
                          <li key={point}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </li>
              ))}
            </ol>
          ) : (
            <p className="session-empty-state">{copy.noEvidence}</p>
          )}
        </section>

        <section className="space-y-3">
          <h3 className="text-base font-semibold text-app-strong">{copy.turnsSectionTitle}</h3>
          {record.turns.length ? (
            <ol className="space-y-3">
              {record.turns.map((turn, index) => (
                <li key={turn.id} className="rounded-[8px] border border-black/8 bg-white p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-black px-2.5 py-1 text-xs text-white">
                      {copy.turnPrefix} {index + 1}
                    </span>
                    <span className="rounded-full border border-black/10 px-2.5 py-1 text-xs text-app-strong">
                      {turn.speaker}
                    </span>
                  </div>
                  <p className="mt-3 text-app-foreground">{turn.content}</p>
                  {turn.referencedEvidenceIds.length ? (
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {turn.referencedEvidenceIds.map((evidenceId) => (
                        <li
                          key={`${turn.id}-${evidenceId}`}
                          className="rounded-full bg-black/[0.04] px-2.5 py-1 text-xs text-app-muted"
                        >
                          {copy.evidencePrefix} {evidenceOrderById.get(evidenceId) ?? evidenceId}
                          {evidenceTitleById.get(evidenceId)
                            ? ` · ${evidenceTitleById.get(evidenceId)}`
                            : ""}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              ))}
            </ol>
          ) : (
            <p className="session-empty-state">{copy.noTurns}</p>
          )}
        </section>

        {record.summary ? (
          <section className="space-y-3">
            <h3 className="text-base font-semibold text-app-strong">{copy.summarySectionTitle}</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-[8px] border border-black/8 bg-black/[0.02] p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-app-muted">
                  {copy.strongestForPrefix}
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {record.summary.strongestFor.map((point) => (
                    <li key={point.text}>{point.text}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-[8px] border border-black/8 bg-black/[0.02] p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-app-muted">
                  {copy.strongestAgainstPrefix}
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {record.summary.strongestAgainst.map((point) => (
                    <li key={point.text}>{point.text}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="space-y-1 text-app-foreground">
              <p>{copy.coreDisagreementPrefix}：{record.summary.coreDisagreement}</p>
              <p>{copy.keyUncertaintyPrefix}：{record.summary.keyUncertainty}</p>
              <p>{copy.nextActionPrefix}：{record.summary.nextAction}</p>
            </div>
          </section>
        ) : null}

        {record.diagnosis ? (
          <section className="space-y-2 rounded-[8px] border border-black/8 bg-black/[0.02] p-4">
            <h3 className="text-base font-semibold text-app-strong">{copy.diagnosisPrefix}</h3>
            <p>{record.diagnosis.summary}</p>
            <p>{record.diagnosis.suggestedFix}</p>
          </section>
        ) : null}

        <div className="flex justify-end border-t border-black/8 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            {copy.closeDetails}
          </Button>
        </div>
      </div>
    </DialogShell>
  );
}

function DeleteHistoryDialog({
  record,
  copy,
  onCancel,
  onConfirm
}: {
  record: HistoryListRecord;
  copy: HistoryCopy;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
}) {
  return (
    <DialogShell title={copy.deleteDialogTitle} onClose={onCancel}>
      <div className="space-y-5 pt-5">
        <p className="text-sm leading-6 text-app-muted">{copy.deleteDialogDescription}</p>
        <p className="rounded-[8px] border border-black/8 bg-black/[0.02] p-4 text-sm font-medium text-app-strong">
          {record.question}
        </p>
        <div className="flex flex-wrap justify-end gap-2 border-t border-black/8 pt-4">
          <Button type="button" variant="secondary" onClick={onCancel}>
            {copy.cancelDelete}
          </Button>
          <Button type="button" onClick={onConfirm}>
            {copy.confirmDelete}
          </Button>
        </div>
      </div>
    </DialogShell>
  );
}

export function HistoryPageContent({
  loadRecords = loadHistoryRecords,
  deleteRecord = deleteHistoryRecordFile
}: HistoryPageContentProps = {}) {
  const { language } = useAppPreferences();
  const router = useRouter();
  const debateWorkspaceState = useOptionalDebateWorkspaceState();
  const [historyRecords, setHistoryRecords] = useState<HistoryListRecord[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [detailRecordId, setDetailRecordId] = useState<string | null>(null);
  const [deleteRecordFileName, setDeleteRecordFileName] = useState<string | null>(null);
  const copy = getWorkspaceCopy(language);
  const historyCopy = copy.history;

  useEffect(() => {
    let cancelled = false;

    void loadRecords().then((result) => {
      if (!cancelled) {
        setHistoryRecords(result.records);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [loadRecords]);

  const visibleRecords = useMemo(
    () =>
      historyRecords.filter((record) => {
        const matchesSearch =
          searchValue.trim().length === 0 ||
          [record.question, record.model, record.roleSummary]
            .join(" ")
            .toLowerCase()
            .includes(searchValue.toLowerCase());
        const matchesStatus = statusFilter === "all" || record.status === statusFilter;

        return matchesSearch && matchesStatus;
      }),
    [historyRecords, searchValue, statusFilter]
  );
  const detailRecord = historyRecords.find((record) => record.id === detailRecordId) ?? null;
  const pendingDeleteRecord =
    historyRecords.find((record) => record.fileName === deleteRecordFileName) ?? null;

  const confirmDeleteRecord = async (record: HistoryListRecord) => {
    const result = await deleteRecord(record.fileName);
    if (result.status === "deleted") {
      setHistoryRecords((current) =>
        current.filter((item) => item.fileName !== record.fileName)
      );
      setDeleteRecordFileName(null);
      setDetailRecordId((current) => (current === record.id ? null : current));
    }
  };

  return (
    <div className="space-y-8 px-6 py-8 lg:px-10 lg:py-10">
      <PageHeader
        title={copy.pages.history.title}
        description={copy.pages.history.description}
      />
      <SectionCard title={historyCopy.filterTitle} description={historyCopy.filterDescription}>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
          <label className="space-y-2 text-sm font-medium text-app-strong">
            <span>{historyCopy.searchLabel}</span>
            <Input
              aria-label={historyCopy.searchLabel}
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder={historyCopy.searchPlaceholder}
            />
          </label>
          <label className="space-y-2 text-sm font-medium text-app-strong">
            <span>{historyCopy.statusLabel}</span>
            <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">{historyCopy.allStatus}</option>
              <option value="complete">{historyCopy.complete}</option>
              <option value="running">{historyCopy.running}</option>
              <option value="failed">{historyCopy.failed}</option>
            </Select>
          </label>
        </div>
      </SectionCard>

      <div className="space-y-4">
        {visibleRecords.map((record) => (
          <HistoryCard
            key={record.id}
            question={record.question}
            createdAt={record.createdAt}
            model={record.model}
            roleSummary={record.roleSummary}
            status={record.status}
            copy={historyCopy}
            onViewDetails={() => {
              setDeleteRecordFileName(null);
              setDetailRecordId(record.id);
            }}
            onRerun={() => {
              setDeleteRecordFileName(null);
              debateWorkspaceState?.setQuestion(record.question);
              debateWorkspaceState?.setDraftPresetSelection(record.presetSelection);
              debateWorkspaceState?.setDraftFirstSpeaker(record.firstSpeaker);
              debateWorkspaceState?.setSession(null);
              debateWorkspaceState?.setHistoryMeta(null);
              debateWorkspaceState?.setErrorKind(null);
              debateWorkspaceState?.setErrorDetail(null);
              debateWorkspaceState?.setIsStopping(false);
              debateWorkspaceState?.setHistorySaveStatus("idle");
              router.push("/debate");
            }}
            onDelete={() => {
              setDetailRecordId(null);
              setDeleteRecordFileName(record.fileName);
            }}
          />
        ))}
      </div>

      {detailRecord ? (
        <HistoryRecordDetailsDialog
          record={detailRecord}
          copy={historyCopy}
          onClose={() => setDetailRecordId(null)}
        />
      ) : null}

      {pendingDeleteRecord ? (
        <DeleteHistoryDialog
          record={pendingDeleteRecord}
          copy={historyCopy}
          onCancel={() => setDeleteRecordFileName(null)}
          onConfirm={() => confirmDeleteRecord(pendingDeleteRecord)}
        />
      ) : null}
    </div>
  );
}
