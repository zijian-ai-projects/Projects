"use client";

import { useMemo, useState } from "react";
import { HistoryCard } from "@/components/common/history-card";
import { PageHeader } from "@/components/common/page-header";
import { SectionCard } from "@/components/common/section-card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useAppPreferences } from "@/lib/app-preferences";
import { getWorkspaceCopy } from "@/lib/workspace-copy";

const historyRecords = [
  {
    id: "h1",
    question: "是否应该在今年转去独立开发？",
    createdAt: "2026-04-10 14:28",
    model: "deepseek-chat",
    roleSummary: "谨慎 / 激进",
    status: "complete" as const
  },
  {
    id: "h2",
    question: "要不要把产品的重心从工具转向内容社区？",
    createdAt: "2026-04-09 21:40",
    model: "deepseek-reasoner",
    roleSummary: "理性 / 直觉",
    status: "running" as const
  },
  {
    id: "h3",
    question: "是否应该把当前工作室搬到上海？",
    createdAt: "2026-04-08 11:05",
    model: "gpt-4.1",
    roleSummary: "成本 / 收益",
    status: "failed" as const
  }
];

export default function HistoryPage() {
  const { language } = useAppPreferences();
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const copy = getWorkspaceCopy(language);
  const historyCopy = copy.history;

  const visibleRecords = useMemo(
    () =>
      historyRecords.filter((record) => {
        const matchesSearch =
          searchValue.trim().length === 0 || record.question.toLowerCase().includes(searchValue.toLowerCase());
        const matchesStatus = statusFilter === "all" || record.status === statusFilter;

        return matchesSearch && matchesStatus;
      }),
    [searchValue, statusFilter]
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
          />
        ))}
      </div>
    </div>
  );
}
