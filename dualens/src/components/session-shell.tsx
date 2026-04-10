"use client";

import { useCallback, useEffect, useState } from "react";
import { QuestionForm } from "@/components/question-form";
import { DebateTimeline } from "@/components/debate-timeline";
import { EvidencePanel } from "@/components/evidence-panel";
import { SummaryPanel } from "@/components/summary-panel";
import { getLocalizedSideIdentityCopy } from "@/lib/side-identities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { getUiCopy, UI_LANGUAGE_OPTIONS } from "@/lib/ui-copy";
import type {
  AppLanguage,
  BuiltInModel,
  DebatePresetSelection,
  SessionDiagnosis,
  ResearchPreviewItem,
  SessionRecord,
  SessionStage,
  UiLanguage
} from "@/lib/types";

type UiCopy = ReturnType<typeof getUiCopy>;
type SessionErrorKind = "start" | "advance" | "stop";
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
  model: BuiltInModel;
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
  stopSession = stopDemoSession
}: {
  createSession?: (input: SessionInput) => Promise<SessionView>;
  continueSession?: (sessionId: string) => Promise<SessionView>;
  stopSession?: (sessionId: string) => Promise<SessionView>;
}) {
  const [session, setSession] = useState<SessionView | null>(null);
  const [errorKind, setErrorKind] = useState<SessionErrorKind | null>(null);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const [isStopping, setIsStopping] = useState(false);
  const [uiLanguage, setUiLanguage] = useState<UiLanguage>("zh-CN");
  const uiCopy = getUiCopy(uiLanguage);
  const errorMessage = errorKind
    ? [uiCopy.sessionErrors[errorKind], errorDetail].filter(Boolean).join(" ")
    : null;
  const handleSubmit = useCallback(
    async (input: SessionInput) => {
      setSession(null);
      setErrorKind(null);
      setErrorDetail(null);
      try {
        const payload: SessionInput = {
          question: input.question,
          presetSelection: input.presetSelection,
          firstSpeaker: input.firstSpeaker,
          language: input.language,
          model: input.model
        };
        const next = await createSession(payload);
        setSession(next);
      } catch (error) {
        setErrorDetail(error instanceof Error && error.message.trim().length > 0 ? error.message : null);
        setErrorKind("start");
      }
    },
    [createSession]
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
            setErrorDetail(null);
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
  }, [continueSession, session]);

  return (
    <main className="min-h-screen px-4 py-6 text-ink sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <Card className="relative overflow-hidden border-black/8 bg-[rgba(255,255,255,0.9)]">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute -left-8 top-8 h-24 w-24 rounded-full bg-[radial-gradient(circle_at_center,rgba(191,91,44,0.08),transparent_70%)]" />
          </div>
          <CardHeader className="relative space-y-5">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl space-y-4">
                <div className="flex items-start gap-4">
                  <div aria-hidden className="relative shrink-0">
                    <svg
                      className="relative h-20 w-20 text-ink/90 opacity-90 sm:h-24 sm:w-24 xl:h-36 xl:w-36"
                      viewBox="0 0 120 120"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <circle
                        cx="60"
                        cy="60"
                        r="58"
                        className="fill-paper/90 stroke-ink/15"
                        strokeWidth="1.5"
                      />
                      <path
                        d="M60 2a58 58 0 0 1 0 116a29 29 0 0 0 0-58a29 29 0 0 1 0-58Z"
                        className="fill-ink"
                      />
                      <circle cx="60" cy="31" r="10" className="fill-paper" />
                      <circle cx="60" cy="89" r="10" className="fill-ink" />
                    </svg>
                  </div>
                  <div className="space-y-2 pt-2">
                    <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-ink md:text-6xl">
                      {uiCopy.heroTitle}
                    </h1>
                    <CardDescription className="max-w-2xl text-base leading-7">
                      {uiCopy.heroLead}
                    </CardDescription>
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-center gap-4 lg:items-end">
                <div
                  aria-label={uiCopy.uiLanguageLabel}
                  className="flex items-center rounded-full border border-black/8 bg-[rgba(255,255,255,0.9)] p-1 shadow-none"
                >
                  {UI_LANGUAGE_OPTIONS.map((language) => (
                    <Button
                      key={language}
                      type="button"
                      variant={uiLanguage === language ? "primary" : "ghost"}
                      className="rounded-full px-3 py-1 text-xs"
                      aria-pressed={uiLanguage === language}
                      onClick={() => setUiLanguage(language)}
                    >
                      {language === "en" ? uiCopy.english : uiCopy.chinese}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <QuestionForm uiLanguage={uiLanguage} onSubmit={handleSubmit} />
            {errorMessage ? (
              <p className="session-alert mt-4" role="alert">
                {errorMessage}
              </p>
            ) : null}
          </CardContent>
        </Card>

        {session ? (
          <section aria-label={uiCopy.debateWorkspaceLabel} className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper">
                {uiCopy.sessionStageLabels[session.stage] ?? stageLabels[session.stage] ?? session.stage}
              </span>
              <span className="text-sm text-ink/60">
                {session.stage === "complete"
                  ? uiCopy.workspaceCompleteStatus
                  : uiCopy.workspaceActiveStatus}
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
            <SideIdentitySummary language={uiLanguage} />
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
    </main>
  );
}
