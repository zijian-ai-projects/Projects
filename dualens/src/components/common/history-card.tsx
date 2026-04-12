import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/common/status-tag";

type HistoryStatus = "complete" | "running" | "failed";

const statusToneMap: Record<HistoryStatus, "success" | "warning" | "danger"> = {
  complete: "success",
  running: "warning",
  failed: "danger"
};

type HistoryCardCopy = {
  complete: string;
  running: string;
  failed: string;
  modelPrefix: string;
  searchEnginePrefix: string;
  debateModePrefix: string;
  rolePrefix: string;
  viewDetails: string;
  rerun: string;
  delete: string;
};

export function HistoryCard({
  question,
  createdAt,
  model,
  searchEngine,
  debateMode,
  roleSummary,
  status,
  copy,
  onViewDetails,
  onRerun,
  onDelete
}: {
  question: string;
  createdAt: string;
  model: string;
  searchEngine: string;
  debateMode: string;
  roleSummary: string;
  status: HistoryStatus;
  copy?: HistoryCardCopy;
  onViewDetails?: () => void;
  onRerun?: () => void;
  onDelete?: () => void | Promise<void>;
}) {
  const fallbackCopy: HistoryCardCopy = {
    complete: "已完成",
    running: "进行中",
    failed: "失败",
    modelPrefix: "模型",
    searchEnginePrefix: "搜索引擎",
    debateModePrefix: "辩论模式",
    rolePrefix: "风格对",
    viewDetails: "查看详情",
    rerun: "重新发起同题辩论",
    delete: "删除"
  };
  const cardCopy = copy ?? fallbackCopy;
  const statusLabel = {
    complete: cardCopy.complete,
    running: cardCopy.running,
    failed: cardCopy.failed
  }[status];

  return (
    <article className="rounded-[28px] border border-black/8 bg-white p-6 shadow-[0_10px_28px_rgba(0,0,0,0.03)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <StatusTag tone={statusToneMap[status]}>{statusLabel}</StatusTag>
            <span className="text-xs uppercase tracking-[0.16em] text-black/40">{createdAt}</span>
          </div>
          <h2 className="text-xl font-semibold tracking-[-0.03em] text-app-strong">{question}</h2>
          <div className="grid gap-2 text-sm text-app-muted lg:grid-cols-2">
            <p>{cardCopy.modelPrefix}：{model}</p>
            <p>{cardCopy.searchEnginePrefix}：{searchEngine}</p>
            <p>{cardCopy.debateModePrefix}：{debateMode}</p>
            <p>{cardCopy.rolePrefix}：{roleSummary}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={onViewDetails}>
            {cardCopy.viewDetails}
          </Button>
          <Button type="button" variant="secondary" onClick={onRerun}>
            {cardCopy.rerun}
          </Button>
          <Button type="button" variant="ghost" onClick={onDelete}>
            {cardCopy.delete}
          </Button>
        </div>
      </div>
    </article>
  );
}
