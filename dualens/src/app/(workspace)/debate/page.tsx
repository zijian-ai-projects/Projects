"use client";

import { useState } from "react";
import { createSession } from "@/app/session-client";
import { PageHeader } from "@/components/common/page-header";
import { SessionShell } from "@/components/session-shell";
import { Button } from "@/components/ui/button";
import type { UiLanguage } from "@/lib/types";

export default function DebatePage() {
  const [uiLanguage, setUiLanguage] = useState<UiLanguage>("zh-CN");

  return (
    <div className="space-y-8 px-6 py-8 lg:px-10 lg:py-10">
      <PageHeader
        title={uiLanguage === "en" ? "Debate" : "辩论"}
        description={
          uiLanguage === "en"
            ? "Frame the decision question and confirm both roles before launching a structured dual-agent debate."
            : "围绕同一问题确认双方立场与风格后，直接启动正式的双智能体辩论流程。"
        }
        action={
          <div
            aria-label={uiLanguage === "en" ? "UI language" : "界面语言"}
            className="flex items-center rounded-full border border-black/8 bg-white p-1"
          >
            <Button
              type="button"
              variant={uiLanguage === "en" ? "primary" : "ghost"}
              className="rounded-full px-3 py-1 text-xs"
              aria-pressed={uiLanguage === "en"}
              onClick={() => setUiLanguage("en")}
            >
              English
            </Button>
            <Button
              type="button"
              variant={uiLanguage === "zh-CN" ? "primary" : "ghost"}
              className="rounded-full px-3 py-1 text-xs"
              aria-pressed={uiLanguage === "zh-CN"}
              onClick={() => setUiLanguage("zh-CN")}
            >
              中文
            </Button>
          </div>
        }
      />
      <SessionShell createSession={createSession} uiLanguage={uiLanguage} />
    </div>
  );
}
