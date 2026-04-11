"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { HistoryCard } from "@/components/common/history-card";
import { PageHeader } from "@/components/common/page-header";
import { SectionCard } from "@/components/common/section-card";
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

function HistoryRecordDetails({
  record,
  copy
}: {
  record: HistoryListRecord;
  copy: HistoryCopy;
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-app-strong">{copy.detailTitle}</h3>
      <div className="grid gap-2 sm:grid-cols-2">
        <p>{copy.searchEnginePrefix}：{record.searchEngine}</p>
        <p>{copy.evidencePrefix}：{record.evidenceCount}</p>
        <p>{copy.turnPrefix}：{record.turnCount}</p>
        <p>{copy.rolePrefix}：{record.roleSummary}</p>
      </div>
      {record.summary ? (
        <div className="space-y-1 text-app-foreground">
          <p>{copy.coreDisagreementPrefix}：{record.summary.coreDisagreement}</p>
          <p>{copy.keyUncertaintyPrefix}：{record.summary.keyUncertainty}</p>
          <p>{copy.nextActionPrefix}：{record.summary.nextAction}</p>
        </div>
      ) : null}
      {record.diagnosis ? (
        <p className="text-app-foreground">
          {copy.diagnosisPrefix}：{record.diagnosis.summary}
        </p>
      ) : null}
    </div>
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
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);
  const [pendingDeleteFileName, setPendingDeleteFileName] = useState<string | null>(null);
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
            details={
              expandedRecordId === record.id ? (
                <HistoryRecordDetails record={record} copy={historyCopy} />
              ) : null
            }
            deleteConfirmationActive={pendingDeleteFileName === record.fileName}
            onViewDetails={() => {
              setPendingDeleteFileName(null);
              setExpandedRecordId((current) => (current === record.id ? null : record.id));
            }}
            onRerun={() => {
              setPendingDeleteFileName(null);
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
            onDelete={async () => {
              if (pendingDeleteFileName !== record.fileName) {
                setPendingDeleteFileName(record.fileName);
                return;
              }

              const result = await deleteRecord(record.fileName);
              if (result.status === "deleted") {
                setHistoryRecords((current) =>
                  current.filter((item) => item.fileName !== record.fileName)
                );
                setPendingDeleteFileName(null);
                setExpandedRecordId((current) => (current === record.id ? null : current));
              }
            }}
            onCancelDelete={() => setPendingDeleteFileName(null)}
          />
        ))}
      </div>
    </div>
  );
}
