"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/common/page-header";
import { SectionCard } from "@/components/common/section-card";
import { StatusTag } from "@/components/common/status-tag";
import { Button } from "@/components/ui/button";
import {
  chooseHistoryFolder,
  loadHistoryFolderState,
  type HistoryFolderState
} from "@/lib/history-folder-store";

const EMPTY_FOLDER_STATE: HistoryFolderState = {
  status: "unselected",
  folderName: null
};

const statusTagCopy = {
  unselected: {
    label: "未选择",
    tone: "neutral"
  },
  authorized: {
    label: "已授权",
    tone: "success"
  },
  "needs-permission": {
    label: "需要重新授权",
    tone: "warning"
  },
  unsupported: {
    label: "当前浏览器不支持",
    tone: "danger"
  }
} as const;

export default function SettingsPage() {
  const [folderState, setFolderState] = useState<HistoryFolderState>(EMPTY_FOLDER_STATE);
  const [isChoosing, setIsChoosing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const currentStatus = statusTagCopy[folderState.status];
  const currentFolderLabel = folderState.folderName ?? "未选择";
  const buttonLabel = folderState.status === "unselected" ? "选择文件夹" : "重新选择";

  useEffect(() => {
    let active = true;

    void loadHistoryFolderState()
      .then((state) => {
        if (active) {
          setFolderState(state);
        }
      })
      .catch(() => {
        if (active) {
          setFolderState(EMPTY_FOLDER_STATE);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  async function handleChooseFolder() {
    setIsChoosing(true);
    setFeedback(null);

    try {
      const nextState = await chooseHistoryFolder();
      setFolderState(nextState);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      setFeedback("目录授权未更新，当前仍保留原有设置。");
    } finally {
      setIsChoosing(false);
    }
  }

  return (
    <div className="space-y-8 px-6 py-8 lg:px-10 lg:py-10">
      <PageHeader
        title="通用设置"
        description="只保留辩论历史的本地保存目录，让记录保存逻辑清晰、克制、可预期。"
      />
      <SectionCard
        title="辩论历史保存文件夹"
        description="每一次辩论记录都会单独保存为一个 JSON 文件，并统一写入你选择的本地目录。"
      >
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)] lg:items-center">
          <div className="space-y-4">
            <p className="text-sm leading-7 text-app-muted">
              选择一个本地文件夹作为历史目录。后续每场辩论都会生成一个唯一 JSON
              文件，文件名带时间戳与会话标识，便于统一归档与后续读取。
            </p>
            <div className="space-y-3 text-sm leading-6 text-app-muted">
              <p>保存规则：一条辩论记录对应一个 JSON 文件。</p>
              <p>文件命名：时间戳 + 会话标识，避免同名覆盖。</p>
              <p>目录句柄仅保存在当前浏览器本地，用于后续自动写入。</p>
            </div>
          </div>

          <div className="rounded-[24px] border border-black/8 bg-black/[0.02] p-5">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-app-muted">
                    当前文件夹
                  </p>
                  <p className="break-all text-sm font-medium leading-6 text-app-strong">
                    {currentFolderLabel}
                  </p>
                </div>
                <StatusTag tone={currentStatus.tone}>{currentStatus.label}</StatusTag>
              </div>

              <div className="space-y-2 text-sm leading-6 text-app-muted">
                <p>
                  {folderState.status === "unsupported"
                    ? "当前浏览器不支持目录访问 API，无法选择本地文件夹。"
                    : "如果目录权限失效，可以重新选择同一目录或切换到新的保存位置。"}
                </p>
                {feedback ? <p className="text-app-strong">{feedback}</p> : null}
              </div>

              <div className="flex justify-end">
                <Button
                  type="button"
                  variant={folderState.status === "unselected" ? "primary" : "secondary"}
                  onClick={handleChooseFolder}
                  disabled={folderState.status === "unsupported" || isChoosing}
                >
                  {isChoosing ? "处理中..." : buttonLabel}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
