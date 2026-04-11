"use client";

import { useEffect, useMemo, useState } from "react";
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
import { getWorkspaceCopy } from "@/lib/workspace-copy";

type HistoryLoadResult = Awaited<ReturnType<typeof loadHistoryRecords>>;

type HistoryPageContentProps = {
  loadRecords?: () => Promise<HistoryLoadResult>;
  deleteRecord?: typeof deleteHistoryRecordFile;
};

export function HistoryPageContent({
  loadRecords = loadHistoryRecords,
  deleteRecord = deleteHistoryRecordFile
}: HistoryPageContentProps = {}) {
  const { language } = useAppPreferences();
  const [historyRecords, setHistoryRecords] = useState<HistoryListRecord[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
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
            onDelete={async () => {
              const result = await deleteRecord(record.fileName);
              if (result.status === "deleted") {
                setHistoryRecords((current) =>
                  current.filter((item) => item.fileName !== record.fileName)
                );
              }
            }}
          />
        ))}
      </div>
    </div>
  );
}
