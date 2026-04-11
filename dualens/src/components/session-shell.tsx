"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { QuestionForm } from "@/components/question-form";
import { DebateTimeline } from "@/components/debate-timeline";
import { EvidencePanel } from "@/components/evidence-panel";
import { SessionDiagnosisPanel } from "@/components/session-diagnosis-panel";
import { SummaryPanel } from "@/components/summary-panel";
import { getLocalizedSideIdentityCopy } from "@/lib/side-identities";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/common/section-card";
import { getUiCopy } from "@/lib/ui-copy";
import { useOptionalDebateQuestionDraft } from "@/lib/debate-question-draft";
import {
  useOptionalDebateWorkspaceState,
  type HistorySaveStatus,
  type SessionErrorKind
} from "@/lib/debate-workspace-state";
import {
  persistSessionHistory,
  type HistoryRecordMeta
} from "@/lib/history-file-writer";
import { loadActiveModelProviderRuntimeConfig } from "@/lib/model-provider-preferences";
import {
  loadActiveSearchEngineRuntimeConfig,
  loadSelectedSearchEngineLabel
} from "@/lib/search-engine-preferences";
import type {
  AppLanguage,
  DebatePresetSelection,
  OpenAICompatibleProviderConfig,
  SearchEngineRuntimeConfig,
  SessionDiagnosis,
  ResearchPreviewItem,
  SessionRecord,
  SessionStage,
  UiLanguage
} from "@/lib/types";

type UiCopy = ReturnType<typeof getUiCopy>;
const SESSION_DIAGNOSIS_STAGES = new Set<SessionDiagnosis["stage"]>(["research", "opening", "debate", "complete"]);
const DIAGNOSTIC_CATEGORIES = new Set<SessionDiagnosis["category"]>([
  "auth",
  "model",
  "endpoint-shape",
  "network",
  "timeout",
  "unknown"
]);
const SESSION_VIEW_STAGES = new Set<SessionStage>(["research", "opening", "debate", "complete"]);
const RESEARCH_PROGRESS_STAGES = new Set([
  "preparing-query",
  "searching-sources",
  "reading-pages",
  "extracting-evidence",
  "preparing-opening"
]);
const RESEARCH_PREVIEW_ITEM_STATUSES = new Set<ResearchPreviewItem["status"]>(["found", "read", "used"]);
const SESSION_POLL_INTERVAL_MS = process.env.NODE_ENV === "test" ? 0 : 1000;

export type SessionInput = {
  question: string;
  presetSelection: DebatePresetSelection;
  firstSpeaker: "lumina" | "vigila";
  language: AppLanguage;
  model: string;
  providerConfig?: OpenAICompatibleProviderConfig;
  searchConfig?: SearchEngineRuntimeConfig;
};

export type SessionView = Pick<
  SessionRecord,
  "id" | "stage" | "evidence" | "turns" | "summary" | "researchProgress" | "diagnosis"
>;

async function createDemoSession(input: SessionInput): Promise<SessionView> {
  const response = await fetch("/api/session", {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    throw await readSessionFetchError(response, "Failed to start debate");
  }

  const session = (await response.json()) as unknown;
  if (!isSessionViewResponse(session)) {
    throw new Error("Invalid session response");
  }

  return session;
}

async function continueDemoSession(sessionId: string): Promise<SessionView> {
  const response = await fetch(`/api/session/${sessionId}`, {
    method: "GET"
  });

  if (!response.ok) {
    throw await readSessionFetchError(response, "Failed to load debate");
  }

  const session = (await response.json()) as unknown;
  if (!isSessionViewResponse(session)) {
    throw new Error("Invalid session response");
  }

  return session;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isResearchPreviewItem(value: unknown): value is ResearchPreviewItem {
  return (
    isRecord(value) &&
    typeof value.title === "string" &&
    typeof value.sourceName === "string" &&
    typeof value.status === "string" &&
    RESEARCH_PREVIEW_ITEM_STATUSES.has(value.status as ResearchPreviewItem["status"])
  );
}

function isEvidence(value: unknown): value is SessionView["evidence"][number] {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.url === "string" &&
    typeof value.sourceName === "string" &&
    typeof value.sourceType === "string" &&
    typeof value.summary === "string" &&
    (value.dataPoints === undefined || isStringArray(value.dataPoints))
  );
}

function isDebateTurn(value: unknown): value is SessionView["turns"][number] {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.speaker === "string" &&
    typeof value.content === "string" &&
    isStringArray(value.referencedEvidenceIds)
  );
}

function isSummaryPoint(value: unknown): value is { text: string; evidenceIds: string[] } {
  return isRecord(value) && typeof value.text === "string" && isStringArray(value.evidenceIds);
}

function isDebateSummary(value: unknown): value is NonNullable<SessionView["summary"]> {
  return (
    isRecord(value) &&
    Array.isArray(value.strongestFor) &&
    value.strongestFor.every(isSummaryPoint) &&
    Array.isArray(value.strongestAgainst) &&
    value.strongestAgainst.every(isSummaryPoint) &&
    typeof value.coreDisagreement === "string" &&
    typeof value.keyUncertainty === "string" &&
    typeof value.nextAction === "string"
  );
}

function isResearchProgress(value: unknown): value is NonNullable<SessionView["researchProgress"]> {
  return (
    isRecord(value) &&
    typeof value.stage === "string" &&
    RESEARCH_PROGRESS_STAGES.has(value.stage) &&
    typeof value.sourceCount === "number" &&
    typeof value.evidenceCount === "number" &&
    Array.isArray(value.previewItems) &&
    value.previewItems.every(isResearchPreviewItem)
  );
}

function isSessionDiagnosisStage(value: unknown): value is SessionDiagnosis["stage"] {
  return typeof value === "string" && SESSION_DIAGNOSIS_STAGES.has(value as SessionDiagnosis["stage"]);
}

function isDiagnosticCategory(value: unknown): value is SessionDiagnosis["category"] {
  return typeof value === "string" && DIAGNOSTIC_CATEGORIES.has(value as SessionDiagnosis["category"]);
}

function isSessionDiagnosis(value: unknown): value is SessionDiagnosis {
  return (
    isRecord(value) &&
    isSessionDiagnosisStage(value.stage) &&
    typeof value.failingStep === "string" &&
    typeof value.providerBaseUrl === "string" &&
    typeof value.providerModel === "string" &&
    isDiagnosticCategory(value.category) &&
    typeof value.summary === "string" &&
    typeof value.suggestedFix === "string"
  );
}

function isSessionViewResponse(value: unknown): value is SessionView {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.stage === "string" &&
    SESSION_VIEW_STAGES.has(value.stage as SessionStage) &&
    Array.isArray(value.evidence) &&
    value.evidence.every(isEvidence) &&
    Array.isArray(value.turns) &&
    value.turns.every(isDebateTurn) &&
    (value.summary === undefined || isDebateSummary(value.summary)) &&
    (value.researchProgress === undefined || isResearchProgress(value.researchProgress)) &&
    (value.diagnosis === undefined || isSessionDiagnosis(value.diagnosis))
  );
}

async function readSessionFetchError(
  response: Response,
  fallback: string
): Promise<Error> {
  try {
    const body = (await response.json()) as unknown;
    if (isRecord(body)) {
      return new Error(
        typeof body.error === "string" && body.error.trim().length > 0 ? body.error : fallback
      );
    }
  } catch {
    // Fall through to the generic fallback below.
  }

  return new Error(fallback);
}

async function stopDemoSession(sessionId: string): Promise<SessionView> {
  const response = await fetch(`/api/session/${sessionId}/stop`, {
    method: "POST"
  });

  if (!response.ok) {
    throw await readSessionFetchError(response, "Failed to stop debate");
  }

  const session = (await response.json()) as unknown;
  if (!isSessionViewResponse(session)) {
    throw new Error("Invalid session response");
  }

  return session;
}

const stageLabels: Partial<Record<SessionStage, string>> = {
  research: "Research in progress",
  opening: "Opening positions",
  debate: "Debate in progress",
  complete: "Summary ready"
};

function formatSessionDiagnosisErrorDetail(diagnosis: SessionDiagnosis) {
  return [diagnosis.summary, diagnosis.suggestedFix].filter(Boolean).join(" ");
}

function ResearchStatus({
  progress,
  copy
}: {
  progress?: SessionView["researchProgress"];
  copy: UiCopy;
}) {
  if (!progress) {
    return null;
  }

  const sourceLabel =
    progress.sourceCount === 1
      ? copy.sourceCountOne
      : copy.sourceCountMany.replace("{count}", String(progress.sourceCount));
  const evidenceLabel =
    progress.evidenceCount === 1
      ? copy.evidenceCountOne
      : copy.evidenceCountMany.replace("{count}", String(progress.evidenceCount));
  const stageLabel = copy.researchProgressStageLabels[progress.stage];

  return (
    <section aria-label={copy.researchProgressTitle} aria-live="polite" className="research-status">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/50">{copy.researchProgressTitle}</p>
          <h2 className="mt-2 text-lg font-semibold text-ink">{stageLabel}</h2>
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-white/80 p-3">
          <p className="text-xs uppercase tracking-[0.16em] text-ink/50">{copy.sourceLabel}</p>
          <p className="mt-1 text-sm font-medium text-ink">{sourceLabel}</p>
        </div>
        <div className="rounded-2xl bg-white/80 p-3">
          <p className="text-xs uppercase tracking-[0.16em] text-ink/50">{copy.evidenceLabel}</p>
          <p className="mt-1 text-sm font-medium text-ink">{evidenceLabel}</p>
        </div>
      </div>
    </section>
  );
}

function SideIdentitySummary({ language }: { language: UiLanguage }) {
  const lumina = getLocalizedSideIdentityCopy("lumina", language);
  const vigila = getLocalizedSideIdentityCopy("vigila", language);

  return (
    <section
      aria-label={language === "en" ? "Debate sides" : "辩论双方"}
      className="grid gap-3 md:grid-cols-2"
    >
      {[lumina, vigila].map((identity) => (
        <div
          key={identity.name}
          className="rounded-2xl border border-black/8 bg-white/80 px-4 py-3"
        >
          <div className="text-sm font-semibold text-ink">{identity.name}</div>
          <div className="mt-1 text-xs uppercase tracking-[0.16em] text-ink/56">
            {identity.descriptor}
          </div>
        </div>
      ))}
    </section>
  );
}

export function SessionShell({
  createSession = createDemoSession,
  continueSession = continueDemoSession,
  stopSession = stopDemoSession,
  uiLanguage = "zh-CN"
}: {
  createSession?: (input: SessionInput) => Promise<SessionView>;
  continueSession?: (sessionId: string) => Promise<SessionView>;
  stopSession?: (sessionId: string) => Promise<SessionView>;
  uiLanguage?: UiLanguage;
}) {
  const workspaceState = useOptionalDebateWorkspaceState();
  const [localSession, setLocalSession] = useState<SessionView | null>(null);
  const [localHistoryMeta, setLocalHistoryMeta] = useState<
    (HistoryRecordMeta & { sessionId: string }) | null
  >(null);
  const [localErrorKind, setLocalErrorKind] = useState<SessionErrorKind | null>(null);
  const [localErrorDetail, setLocalErrorDetail] = useState<string | null>(null);
  const [localIsStopping, setLocalIsStopping] = useState(false);
  const [localHistorySaveStatus, setLocalHistorySaveStatus] = useState<HistorySaveStatus>("idle");
  const [localQuestionDraft, setLocalQuestionDraft] = useState("");
  const workspaceQuestionDraft = useOptionalDebateQuestionDraft();
  const persistQueueRef = useRef<Promise<unknown>>(Promise.resolve());
  const latestHistorySessionIdRef = useRef<string | null>(null);
  const uiCopy = getUiCopy(uiLanguage);
  const session = workspaceState?.session ?? localSession;
  const setSession = workspaceState?.setSession ?? setLocalSession;
  const historyMeta = workspaceState?.historyMeta ?? localHistoryMeta;
  const setHistoryMeta = workspaceState?.setHistoryMeta ?? setLocalHistoryMeta;
  const errorKind = workspaceState?.errorKind ?? localErrorKind;
  const setErrorKind = workspaceState?.setErrorKind ?? setLocalErrorKind;
  const errorDetail = workspaceState?.errorDetail ?? localErrorDetail;
  const setErrorDetail = workspaceState?.setErrorDetail ?? setLocalErrorDetail;
  const isStopping = workspaceState?.isStopping ?? localIsStopping;
  const setIsStopping = workspaceState?.setIsStopping ?? setLocalIsStopping;
  const historySaveStatus = workspaceState?.historySaveStatus ?? localHistorySaveStatus;
  const setHistorySaveStatus = workspaceState?.setHistorySaveStatus ?? setLocalHistorySaveStatus;
  const questionDraft = workspaceState ?? workspaceQuestionDraft ?? {
    question: localQuestionDraft,
    setQuestion: setLocalQuestionDraft
  };
  const errorMessage = errorKind
    ? [uiCopy.sessionErrors[errorKind], errorDetail].filter(Boolean).join(" ")
    : null;
  const historySaveMessage =
    session?.stage === "complete" && historySaveStatus === "skipped"
      ? uiCopy.historyFolderReminder
      : session?.stage === "complete" && historySaveStatus === "error"
        ? uiCopy.historySaveError
        : null;
  const handleSubmit = useCallback(
    async (input: SessionInput) => {
      const createdAt = new Date().toISOString();
      const searchEngine = loadSelectedSearchEngineLabel();
      setSession(null);
      setHistoryMeta(null);
      setErrorKind(null);
      setErrorDetail(null);
      setIsStopping(false);
      setHistorySaveStatus("idle");
      try {
        const providerConfig = loadActiveModelProviderRuntimeConfig();
        const searchConfig = loadActiveSearchEngineRuntimeConfig();
        const payload: SessionInput = {
          question: input.question,
          presetSelection: input.presetSelection,
          firstSpeaker: input.firstSpeaker,
          language: input.language,
          model: providerConfig?.model ?? input.model,
          ...(providerConfig ? { providerConfig } : {}),
          ...(searchConfig ? { searchConfig } : {})
        };
        const next = await createSession(payload);
        setHistoryMeta({
          sessionId: next.id,
          createdAt,
          question: input.question,
          presetSelection: input.presetSelection,
          firstSpeaker: input.firstSpeaker,
          language: input.language,
          model: payload.model,
          searchEngine
        });
        setSession(next);
      } catch (error) {
        setErrorDetail(error instanceof Error && error.message.trim().length > 0 ? error.message : null);
        setErrorKind("start");
      }
    },
    [
      createSession,
      setErrorDetail,
      setErrorKind,
      setHistoryMeta,
      setHistorySaveStatus,
      setIsStopping,
      setSession
    ]
  );

  useEffect(() => {
    document.title = uiCopy.appTitle;
  }, [uiCopy.appTitle]);

  useEffect(() => {
    if (!session || session.stage === "complete" || session.diagnosis) {
      return;
    }

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const poll = async () => {
      try {
        const next = await continueSession(session.id);
        if (!cancelled) {
          setSession(next);
          if (next.diagnosis) {
            setErrorKind("advance");
            setErrorDetail(formatSessionDiagnosisErrorDetail(next.diagnosis));
          } else {
            setErrorKind(null);
            setErrorDetail(null);
          }

          if (next.stage !== "complete" && !next.diagnosis) {
            timeoutId = setTimeout(poll, SESSION_POLL_INTERVAL_MS);
          }
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        setErrorDetail(error instanceof Error && error.message.trim().length > 0 ? error.message : null);
        setErrorKind("advance");
      }
    };

    timeoutId = setTimeout(poll, SESSION_POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [continueSession, session, setErrorDetail, setErrorKind, setSession]);

  useEffect(() => {
    if (!session || !historyMeta) {
      return;
    }

    latestHistorySessionIdRef.current = historyMeta.sessionId;
    persistQueueRef.current = persistQueueRef.current
      .catch(() => undefined)
      .then(async () => {
        const result = await persistSessionHistory(historyMeta, session);

        if (latestHistorySessionIdRef.current === historyMeta.sessionId) {
          setHistorySaveStatus(result.status);
        }

        return result;
      });
  }, [historyMeta, session, setHistorySaveStatus]);

  return (
    <div className="space-y-8">
      <QuestionForm
        uiLanguage={uiLanguage}
        onSubmit={handleSubmit}
        questionValue={questionDraft.question}
        onQuestionChange={questionDraft.setQuestion}
        presetSelectionValue={workspaceState?.draftPresetSelection ?? undefined}
        onPresetSelectionChange={workspaceState?.setDraftPresetSelection}
        firstSpeakerValue={workspaceState?.draftFirstSpeaker ?? undefined}
        onFirstSpeakerChange={workspaceState?.setDraftFirstSpeaker}
      />
      {errorMessage ? (
        <p className="session-alert" role="alert">
          {errorMessage}
        </p>
      ) : null}
      {historySaveMessage ? (
        <p
          className="session-alert"
          role={historySaveStatus === "error" ? "alert" : "status"}
        >
          {historySaveMessage}
        </p>
      ) : null}

      {session ? (
        <section aria-label={uiCopy.debateWorkspaceLabel} className="space-y-6">
          <SectionCard
            title={uiLanguage === "en" ? "Current session" : "当前会话"}
            description={
              session.stage === "complete"
                ? uiCopy.workspaceCompleteStatus
                : uiCopy.workspaceActiveStatus
            }
            action={
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-black bg-black px-4 py-2 text-xs font-medium uppercase tracking-[0.16em] text-white">
                  {uiCopy.sessionStageLabels[session.stage] ?? stageLabels[session.stage] ?? session.stage}
                </span>
                {session.stage !== "complete" ? (
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={isStopping}
                    onClick={async () => {
                      setErrorKind(null);
                      setErrorDetail(null);
                      setIsStopping(true);
                      try {
                        const next = await stopSession(session.id);
                        setSession(next);
                      } catch (error) {
                        setErrorDetail(error instanceof Error && error.message.trim().length > 0 ? error.message : null);
                        setErrorKind("stop");
                      } finally {
                        setIsStopping(false);
                      }
                    }}
                  >
                    {isStopping ? uiCopy.stopping : uiCopy.stopDebate}
                  </Button>
                ) : null}
              </div>
            }
          >
            <SideIdentitySummary language={uiLanguage} />
          </SectionCard>

          {session.diagnosis ? (
            <SessionDiagnosisPanel diagnosis={session.diagnosis} copy={uiCopy} />
          ) : null}

          <ResearchStatus progress={session.researchProgress} copy={uiCopy} />
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.9fr)]">
            <DebateTimeline turns={session.turns} evidence={session.evidence} language={uiLanguage} />
            <EvidencePanel
              evidence={session.evidence}
              previewItems={session.researchProgress?.previewItems}
              language={uiLanguage}
            />
          </div>
          <SummaryPanel summary={session.summary} evidence={session.evidence} language={uiLanguage} />
        </section>
      ) : null}
    </div>
  );
}
