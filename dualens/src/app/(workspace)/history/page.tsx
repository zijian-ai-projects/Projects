"use client";

import { useMemo, useState } from "react";
import { HistoryCard } from "@/components/common/history-card";
import { PageHeader } from "@/components/common/page-header";
import { SectionCard } from "@/components/common/section-card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

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
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

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
        title="辩论历史"
        description="集中管理既往问题、模型选择、双方角色设定与会话状态，让重新查看和复盘成为标准流程。"
      />
      <SectionCard title="检索与筛选" description="先按问题搜索，再按状态缩小记录范围。">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
          <label className="space-y-2 text-sm font-medium text-app-strong">
            <span>搜索历史</span>
            <Input
              aria-label="搜索历史"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="搜索问题标题、模型或角色设定"
            />
          </label>
          <label className="space-y-2 text-sm font-medium text-app-strong">
            <span>状态</span>
            <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">全部状态</option>
              <option value="complete">已完成</option>
              <option value="running">进行中</option>
              <option value="failed">失败</option>
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
          />
        ))}
      </div>
    </div>
  );
}
