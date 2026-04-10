import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/common/status-tag";

type HistoryStatus = "complete" | "running" | "failed";

const statusMap: Record<HistoryStatus, { label: string; tone: "success" | "warning" | "danger" }> = {
  complete: { label: "已完成", tone: "success" },
  running: { label: "进行中", tone: "warning" },
  failed: { label: "失败", tone: "danger" }
};

export function HistoryCard({
  question,
  createdAt,
  model,
  roleSummary,
  status
}: {
  question: string;
  createdAt: string;
  model: string;
  roleSummary: string;
  status: HistoryStatus;
}) {
  const tag = statusMap[status];

  return (
    <article className="rounded-[28px] border border-black/8 bg-white p-6 shadow-[0_10px_28px_rgba(0,0,0,0.03)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <StatusTag tone={tag.tone}>{tag.label}</StatusTag>
            <span className="text-xs uppercase tracking-[0.16em] text-black/40">{createdAt}</span>
          </div>
          <h2 className="text-xl font-semibold tracking-[-0.03em] text-app-strong">{question}</h2>
          <div className="grid gap-2 text-sm text-app-muted lg:grid-cols-2">
            <p>模型：{model}</p>
            <p>角色设定：{roleSummary}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary">
            查看详情
          </Button>
          <Button type="button" variant="secondary">
            重新发起同题辩论
          </Button>
          <Button type="button" variant="ghost">
            删除
          </Button>
        </div>
      </div>
    </article>
  );
}
