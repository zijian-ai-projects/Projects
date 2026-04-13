"use client";

import { type ReactNode, useEffect, useState } from "react";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { useAppPreferences } from "@/lib/app-preferences";
import {
  chooseHistoryFolder,
  clearHistoryFolder,
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
  const [isClearing, setIsClearing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const copy = getWorkspaceCopy(language);
  const settingsCopy = copy.settings;
  const isFolderUnsupported = folderState.status === "unsupported";
  const currentFolderLabel = isFolderUnsupported
    ? settingsCopy.unsupported
    : folderState.folderName ?? settingsCopy.unselected;
  const buttonLabel =
    folderState.status === "authorized" || folderState.status === "needs-permission"
      ? settingsCopy.reselectFolder
      : settingsCopy.chooseFolder;
  const currentLanguageLabel = language === "zh-CN" ? settingsCopy.chinese : settingsCopy.english;
  const canClearFolder = Boolean(folderState.folderName);

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

  async function handleClearFolder() {
    setIsClearing(true);
    setFeedback(null);

    try {
      const nextState = await clearHistoryFolder();
      setFolderState(nextState);
    } catch {
      setFeedback(settingsCopy.feedback);
    } finally {
      setIsClearing(false);
    }
  }

  return (
    <div
      data-testid="settings-page-shell"
      className="mx-auto w-full max-w-[1600px] space-y-8 px-6 py-8 lg:px-8"
    >
      <PageHeader
        title={copy.pages.settings.title}
        description={copy.pages.settings.description}
      />
      <SettingsCard
        testId="settings-card-language"
        iconTestId="settings-card-icon-language"
        icon={<LanguageIcon className="h-6 w-6" />}
        title={settingsCopy.languageTitle}
        description={settingsCopy.languageDescription}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex h-12 min-w-0 flex-1 items-center gap-3 rounded-[8px] border border-app-line bg-black/[0.02] px-4 text-sm text-app-strong">
            <LanguageIcon className="h-5 w-5 shrink-0 text-[#D97757]" />
            <span className="min-w-0 truncate text-app-muted">{settingsCopy.currentLanguage}</span>
            <span className="ml-auto shrink-0 font-semibold">{currentLanguageLabel}</span>
          </div>
          <div
            aria-label={settingsCopy.languageTitle}
            className="inline-flex h-12 w-fit items-center rounded-[8px] border border-app-line bg-black/[0.02] p-1"
          >
            <Button
              type="button"
              variant={language === "zh-CN" ? "primary" : "ghost"}
              className="h-10 rounded-[6px] px-4 py-0 text-xs"
              aria-pressed={language === "zh-CN"}
              onClick={() => setLanguage("zh-CN")}
            >
              {settingsCopy.chinese}
            </Button>
            <Button
              type="button"
              variant={language === "en" ? "primary" : "ghost"}
              className="h-10 rounded-[6px] px-4 py-0 text-xs"
              aria-pressed={language === "en"}
              onClick={() => setLanguage("en")}
            >
              {settingsCopy.english}
            </Button>
          </div>
        </div>
      </SettingsCard>
      <SettingsCard
        testId="settings-card-history-folder"
        iconTestId="settings-card-icon-history-folder"
        icon={<FolderIcon className="h-6 w-6" />}
        title={settingsCopy.historyTitle}
        description={settingsCopy.historyDescription}
      >
        <div className="flex flex-col gap-4">
          <div data-testid="current-history-folder-row" className="flex flex-col gap-1 py-2">
            <p className="text-[11px] uppercase tracking-[0.16em] text-app-muted">
              {settingsCopy.currentFolder}
            </p>
            <div
              data-testid="history-folder-status-field"
              className={[
                "flex h-12 min-w-0 items-center gap-3 rounded-[8px] px-4 text-sm font-mono transition-colors",
                folderState.folderName
                  ? "border border-app-line bg-black/[0.02] text-app-strong"
                  : "border border-dashed border-app-line bg-white/70 text-app-muted"
              ].join(" ")}
            >
              <FolderIcon className="h-5 w-5 shrink-0 text-[#D97757]" />
              <span className="min-w-0 truncate font-medium">{currentFolderLabel}</span>
            </div>
          </div>

          {feedback ? (
            <p className="text-sm leading-6 text-app-strong">{feedback}</p>
          ) : null}
          {isFolderUnsupported ? (
            <p className="text-sm leading-6 text-app-muted">{settingsCopy.unsupportedMessage}</p>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <Button
              type="button"
              variant={folderState.status === "unselected" ? "primary" : "secondary"}
              className="h-12 px-6"
              onClick={handleChooseFolder}
              disabled={folderState.status === "unsupported" || isChoosing || isClearing}
            >
              {isChoosing ? settingsCopy.processing : buttonLabel}
            </Button>
            {canClearFolder ? (
              <Button
                type="button"
                aria-label={settingsCopy.clearFolder}
                variant="secondary"
                className="h-12 w-12 border-red-200 px-0 text-red-600 hover:bg-red-50"
                onClick={handleClearFolder}
                disabled={isChoosing || isClearing}
              >
                <TrashIcon className="h-5 w-5" />
              </Button>
            ) : null}
          </div>
        </div>
      </SettingsCard>
    </div>
  );
}

function SettingsCard({
  testId,
  iconTestId,
  icon,
  title,
  description,
  children
}: {
  testId: string;
  iconTestId: string;
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section
      data-testid={testId}
      className="overflow-hidden rounded-[16px] border border-gray-200 bg-white/95 shadow-sm backdrop-blur transition-all duration-300 hover:shadow-md"
    >
      <div className="border-b border-gray-200/80 px-6 py-6 md:px-8">
        <div className="flex items-start gap-4">
          <div
            data-testid={iconTestId}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[8px] bg-[#D97757]/10 text-[#D97757]"
          >
            {icon}
          </div>
          <div className="min-w-0 space-y-1">
            <h2 className="text-xl font-semibold text-app-strong">{title}</h2>
            <p className="max-w-4xl text-base leading-7 text-app-muted">{description}</p>
          </div>
        </div>
      </div>
      <div className="px-6 py-6 md:px-8 md:py-8">{children}</div>
    </section>
  );
}

function LanguageIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 5h9" />
      <path d="M9 3v2" />
      <path d="M6 9c1.2 2.5 3.4 4.4 6.2 5.4" />
      <path d="M12 5c-.8 4.6-3 7.8-7 10" />
      <path d="M14 19l3-7 3 7" />
      <path d="M15.2 16.5h3.6" />
    </svg>
  );
}

function FolderIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3.8 6.5h6.3l2 2h8.1" />
      <path d="M4 6.5v10.8c0 .8.7 1.5 1.5 1.5h13c.8 0 1.5-.7 1.5-1.5V9.8c0-.8-.7-1.5-1.5-1.5h-6.4" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 7h16" />
      <path d="M9 7V5.5C9 4.7 9.7 4 10.5 4h3C14.3 4 15 4.7 15 5.5V7" />
      <path d="M18 7l-.8 11.1c-.1 1.1-.9 1.9-2 1.9H8.8c-1.1 0-1.9-.8-2-1.9L6 7" />
      <path d="M10 11v5" />
      <path d="M14 11v5" />
    </svg>
  );
}
