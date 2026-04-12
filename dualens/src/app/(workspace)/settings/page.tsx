"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/common/page-header";
import { SectionCard } from "@/components/common/section-card";
import { Button } from "@/components/ui/button";
import { useAppPreferences } from "@/lib/app-preferences";
import {
  chooseHistoryFolder,
  loadHistoryFolderState,
  type HistoryFolderState
} from "@/lib/history-folder-store";
import { getWorkspaceCopy } from "@/lib/workspace-copy";

const EMPTY_FOLDER_STATE: HistoryFolderState = {
  status: "unselected",
  folderName: null
};

export default function SettingsPage() {
  const { language, setLanguage } = useAppPreferences();
  const [folderState, setFolderState] = useState<HistoryFolderState>(EMPTY_FOLDER_STATE);
  const [isChoosing, setIsChoosing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const copy = getWorkspaceCopy(language);
  const settingsCopy = copy.settings;
  const currentFolderLabel = folderState.folderName ?? settingsCopy.unselected;
  const buttonLabel =
    folderState.status === "unselected" ? settingsCopy.chooseFolder : settingsCopy.reselectFolder;

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

      setFeedback(settingsCopy.feedback);
    } finally {
      setIsChoosing(false);
    }
  }

  return (
    <div className="space-y-8 px-6 py-8 lg:px-10 lg:py-10">
      <PageHeader
        title={copy.pages.settings.title}
        description={copy.pages.settings.description}
      />
      <SectionCard
        title={settingsCopy.languageTitle}
        description={settingsCopy.languageDescription}
      >
        <div className="flex justify-start lg:justify-end">
          <div
            aria-label={settingsCopy.languageTitle}
            className="inline-flex w-fit items-center rounded-full border border-black/8 bg-black/[0.02] p-1"
          >
            <Button
              type="button"
              variant={language === "zh-CN" ? "primary" : "ghost"}
              className="rounded-full px-3 py-1 text-xs"
              aria-pressed={language === "zh-CN"}
              onClick={() => setLanguage("zh-CN")}
            >
              {settingsCopy.chinese}
            </Button>
            <Button
              type="button"
              variant={language === "en" ? "primary" : "ghost"}
              className="rounded-full px-3 py-1 text-xs"
              aria-pressed={language === "en"}
              onClick={() => setLanguage("en")}
            >
              {settingsCopy.english}
            </Button>
          </div>
        </div>
      </SectionCard>
      <SectionCard
        title={settingsCopy.historyTitle}
        description={settingsCopy.historyDescription}
      >
        <div className="rounded-[24px] border border-black/8 bg-black/[0.02] p-4">
          <div className="flex flex-col gap-3">
            <div data-testid="current-history-folder-row" className="flex flex-col gap-1 py-2">
              <p className="text-[11px] uppercase tracking-[0.16em] text-app-muted">
                {settingsCopy.currentFolder}
              </p>
              <p className="break-all text-sm font-medium leading-6 text-app-strong">
                {currentFolderLabel}
              </p>
            </div>

            {feedback ? (
              <p className="text-sm leading-6 text-app-strong">{feedback}</p>
            ) : null}

            <div className="flex justify-end">
              <Button
                type="button"
                variant={folderState.status === "unselected" ? "primary" : "secondary"}
                onClick={handleChooseFolder}
                disabled={folderState.status === "unsupported" || isChoosing}
              >
                {isChoosing ? settingsCopy.processing : buttonLabel}
              </Button>
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
