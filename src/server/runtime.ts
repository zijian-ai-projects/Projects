import { createOrchestrator } from "@/server/orchestrator";
import { createDebateAgent } from "@/server/debate/agent";
import { createSummaryService } from "@/server/debate/summary";
import { createOpenAICompatibleProvider } from "@/server/llm/openai-compatible-provider";
import { classifyProviderError } from "@/server/diagnostics/error-classifier";
import { createDuckDuckGoProvider } from "@/server/research/duckduckgo-provider";
import { createMockSearchProvider } from "@/server/research/mock-search-provider";
import { createResearchService } from "@/server/research/research-service";
import { createTavilyProvider } from "@/server/research/tavily-provider";
import { createSessionStore } from "@/server/session-store";
import { getLocalizedSideIdentityCopy } from "@/lib/side-identities";
import { getUiCopy } from "@/lib/ui-copy";
import { buildResearchProgressView } from "@/lib/types";
import { createSessionInputSchema } from "@/lib/validators";
import type {
  BuiltInModel,
  DebateTurn,
  OpenAICompatibleProviderConfig,
  ResearchProgressView,
  SessionDiagnosis,
  SessionDiagnosisContext,
  SessionDiagnosisStage,
  SessionRecord,
  SpeakerSideKey
} from "@/lib/types";

const store = createSessionStore();
const activeSessionRunners = new Map<string, Promise<void>>();
const DEEPSEEK_BASE_URL = "https://api.deepseek.com";
const PROVIDER_API_KEY_ENV_KEYS = [
  "DEEPSEEK_API_KEY",
  "OPENAI_API_KEY",
  "OPENAI_COMPATIBLE_API_KEY",
  "API_KEY",
  "api_key"
] as const;
const PROVIDER_BASE_URL_ENV_KEYS = [
  "DEEPSEEK_BASE_URL",
  "OPENAI_BASE_URL",
  "OPENAI_COMPATIBLE_BASE_URL",
  "BASE_URL",
  "base_url"
] as const;

type ConfiguredResearchProvider = ReturnType<typeof createDuckDuckGoProvider> & {
  diagnosticBaseUrl: string;
  diagnosticLabel: string;
};

type DiagnosableSession = SessionRecord & {
  stage: SessionDiagnosisStage;
};

function createResearchProvider() {
  const tavilyApiKey = process.env.TAVILY_API_KEY?.trim();
  if (tavilyApiKey) {
    const tavilyProvider = createTavilyProvider({ apiKey: tavilyApiKey });
    const extractor = createDuckDuckGoProvider();

    return {
      search: tavilyProvider.search,
      extract: extractor.extract,
      diagnosticBaseUrl: "https://api.tavily.com/search",
      diagnosticLabel: "tavily"
    } satisfies ConfiguredResearchProvider;
  }

  if (process.env.NODE_ENV === "test" || process.env.MOCK_RESEARCH === "1") {
    return {
      ...createMockSearchProvider(),
      diagnosticBaseUrl: "mock://research",
      diagnosticLabel: "mock-research"
    } satisfies ConfiguredResearchProvider;
  }

  return {
    ...createDuckDuckGoProvider(),
    diagnosticBaseUrl: "https://html.duckduckgo.com/html/",
    diagnosticLabel: "duckduckgo"
  } satisfies ConfiguredResearchProvider;
}

function getResearchService() {
  const provider = createResearchProvider();

  return {
    provider,
    service: createResearchService(provider)
  };
}

function getFirstConfiguredEnvValue(keys: readonly string[]) {
  for (const key of keys) {
    const value = process.env[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }

  return undefined;
}

function isAbsoluteHttpUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

function getProviderBaseUrl() {
  for (const key of PROVIDER_BASE_URL_ENV_KEYS) {
    const value = process.env[key];
    if (typeof value === "string" && isAbsoluteHttpUrl(value.trim())) {
      return value.trim();
    }
  }

  return DEEPSEEK_BASE_URL;
}

function getProviderApiKey() {
  const apiKey = getFirstConfiguredEnvValue(PROVIDER_API_KEY_ENV_KEYS);
  if (!apiKey) {
    throw new Error("Provider API key is required");
  }

  return apiKey;
}

function resolveDeepSeekProviderConfig(model: BuiltInModel): OpenAICompatibleProviderConfig {
  return {
    baseUrl: getProviderBaseUrl(),
    apiKey: getProviderApiKey(),
    model
  };
}

function getSessionProviderConfig(session: SessionRecord): OpenAICompatibleProviderConfig {
  return session.config.provider;
}

function createTurnCompletion(session: SessionRecord) {
  const { baseUrl, apiKey, model } = getSessionProviderConfig(session);

  return createOpenAICompatibleProvider<{
    speaker: string;
    content: string;
    referencedEvidenceIds: string[];
  }>({
    baseUrl,
    apiKey,
    model
  });
}

function createSummaryCompletion(session: SessionRecord) {
  const { baseUrl, apiKey, model } = getSessionProviderConfig(session);

  return createOpenAICompatibleProvider<NonNullable<SessionRecord["summary"]>>({
    baseUrl,
    apiKey,
    model
  });
}

export function buildSessionDiagnosis(
  error: unknown,
  context: SessionDiagnosisContext
): SessionDiagnosis {
  return classifyProviderError(error, context);
}

function getSpeakerTitles(session: SessionRecord) {
  const language = session.language ?? "en";
  const lumina = getLocalizedSideIdentityCopy("lumina", language);
  const vigila = getLocalizedSideIdentityCopy("vigila", language);

  return [lumina.name, vigila.name] as const;
}

function getSpeakerOrder(session: SessionRecord): readonly [SpeakerSideKey, SpeakerSideKey] {
  const firstSpeaker = session.firstSpeaker ?? "lumina";
  return firstSpeaker === "lumina" ? ["lumina", "vigila"] : ["vigila", "lumina"];
}

function createDebateTurn(turn: Omit<DebateTurn, "id">): DebateTurn {
  return {
    id: crypto.randomUUID(),
    ...turn
  };
}

export function buildResearchProgress(session: SessionRecord): ResearchProgressView {
  return buildResearchProgressView(session.evidence);
}

function buildProgressFromPreviewItems(
  previewItems: ResearchProgressView["previewItems"],
  options: {
    stage: ResearchProgressView["stage"];
    evidence: SessionRecord["evidence"];
  }
): ResearchProgressView {
  return {
    stage: options.stage,
    sourceCount: new Set(
      [...options.evidence.map((item) => item.sourceName), ...previewItems.map((item) => item.sourceName)]
    ).size,
    evidenceCount: options.evidence.length,
    previewItems
  };
}

function getNextSpeakerTitle(session: SessionRecord) {
  const [firstSpeaker, secondSpeaker] = getSpeakerOrder(session);
  const [luminaTitle, vigilaTitle] = getSpeakerTitles(session);
  const nextSpeaker = session.turns.length % 2 === 0 ? firstSpeaker : secondSpeaker;

  return nextSpeaker === "lumina" ? luminaTitle : vigilaTitle;
}

async function generateNextTurn(session: SessionRecord) {
  const agent = createDebateAgent(createTurnCompletion(session));
  return createDebateTurn(await agent.createOpeningTurn(session, getNextSpeakerTitle(session)));
}

function normalizeSearchSnippet(value: string, maxLength = 240) {
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function buildDebateResearchQuery(session: SessionRecord) {
  const recentTurns = session.turns
    .slice(-2)
    .map((turn) => ({
      speaker: typeof turn.speaker === "string" ? turn.speaker : "Unknown speaker",
      content: typeof turn.content === "string" ? normalizeSearchSnippet(turn.content) : ""
    }))
    .filter((turn) => turn.content.length > 0);
  const latestTurn = recentTurns.at(-1);
  const previousTurn = recentTurns.at(-2);

  if (!latestTurn) {
    return session.question;
  }

  return [
    `Question: ${session.question}`,
    `Latest claim to verify: ${latestTurn.speaker}: ${latestTurn.content}`,
    previousTurn ? `Prior claim being challenged: ${previousTurn.speaker}: ${previousTurn.content}` : null,
    "Find current facts, data, case studies, or expert analysis that support or challenge the latest claim."
  ]
    .filter(Boolean)
    .join("\n");
}

function mergeEvidence(existing: SessionRecord["evidence"], incoming: SessionRecord["evidence"]) {
  const seen = new Set(existing.map((item) => item.url));
  const merged = [...existing];

  for (const item of incoming) {
    if (seen.has(item.url)) {
      continue;
    }

    seen.add(item.url);
    merged.push(item);
  }

  return merged;
}

async function buildDebateEvidenceWithFallback(sessionId: string, session: SessionRecord) {
  const { service: researchService } = getResearchService();

  try {
    const additionalEvidence = await researchService.buildSharedEvidence(buildDebateResearchQuery(session), {
      onResultsFound: async (results) => {
        const current = getSessionOrThrow(sessionId);
        const previewItems = results.slice(0, 5).map((result) => ({
          title: result.title,
          sourceName: result.sourceName,
          status: "found" as const
        }));
        store.save({
          ...cloneSession(current),
          researchProgress: buildProgressFromPreviewItems(previewItems, {
            stage: "searching-sources",
            evidence: current.evidence
          })
        });
      }
    });

    return mergeEvidence(session.evidence, additionalEvidence);
  } catch {
    return getSessionOrThrow(sessionId).evidence;
  }
}

async function generateTurnPair(session: SessionRecord) {
  const agent = createDebateAgent(createTurnCompletion(session));
  const [firstSpeaker, secondSpeaker] = getSpeakerOrder(session);
  const [luminaTitle, vigilaTitle] = getSpeakerTitles(session);
  const firstSpeakerTitle = firstSpeaker === "lumina" ? luminaTitle : vigilaTitle;
  const secondSpeakerTitle = secondSpeaker === "lumina" ? luminaTitle : vigilaTitle;
  const first = createDebateTurn(await agent.createOpeningTurn(session, firstSpeakerTitle));
  const second = await agent.createOpeningTurn(
    { ...session, turns: [...session.turns, first] },
    secondSpeakerTitle
  );

  return [...session.turns, first, createDebateTurn(second)];
}

const orchestrator = createOrchestrator(store, {
  runSharedResearch: (session) => getResearchService().service.buildSharedEvidence(session.question),
  runOpeningRound: async (session) => ({
    ...session,
    turns: await generateTurnPair(session)
  }),
  runDebateRound: async (session) => {
    const additionalEvidence = await getResearchService().service.buildSharedEvidence(buildDebateResearchQuery(session));
    const evidence = mergeEvidence(session.evidence, additionalEvidence);

    return {
      ...session,
      evidence,
      researchProgress: buildResearchProgressView(evidence),
      turns: await generateTurnPair({ ...session, evidence })
    };
  },
  runSummary: async (session) => createSummaryService(createSummaryCompletion(session)).generate(session)
});

function cloneSession(session: SessionRecord): SessionRecord {
  return structuredClone(session);
}

type ClientSessionRecord = Omit<SessionRecord, "config"> & {
  config: Omit<SessionRecord["config"], "provider"> & {
    provider: Omit<OpenAICompatibleProviderConfig, "apiKey">;
  };
};

function redactSessionForClient(session: SessionRecord): ClientSessionRecord {
  const cloned = cloneSession(session);
  const provider: Omit<OpenAICompatibleProviderConfig, "apiKey"> = {
    baseUrl: cloned.config.provider.baseUrl,
    model: cloned.config.provider.model
  };

  return {
    ...cloned,
    config: {
      ...cloned.config,
      provider
    }
  };
}

function shouldPersistDiagnosis(session: SessionRecord) {
  return session.stage === "research" || session.stage === "opening" || session.stage === "debate";
}

function getDiagnosisStep(session: SessionRecord) {
  if (session.stage === "research") {
    return "run-shared-research";
  }

  if (session.stage === "opening") {
    return "run-opening-round";
  }

  if (session.stage === "debate" && session.turns.length >= session.config.roundCount * 2) {
    return "run-summary";
  }

  return "run-debate-round";
}

function getDiagnosisContext(session: DiagnosableSession): SessionDiagnosisContext {
  if (session.stage === "research") {
    const { provider } = getResearchService();

    return {
      stage: session.stage,
      step: getDiagnosisStep(session),
      baseUrl: provider.diagnosticBaseUrl,
      model: provider.diagnosticLabel
    };
  }

  return {
    stage: session.stage,
    step: getDiagnosisStep(session),
    baseUrl: getSessionProviderConfig(session).baseUrl,
    model: getSessionProviderConfig(session).model
  };
}

function persistDiagnosis(sessionId: string, error: unknown) {
  const session = store.get(sessionId);
  if (!session || !shouldPersistDiagnosis(session)) {
    return;
  }

  const diagnosis = buildSessionDiagnosis(error, getDiagnosisContext(session as DiagnosableSession));

  store.save({
    ...cloneSession(session),
    diagnosis
  });
}

function createStoppedSummary(session: SessionRecord) {
  const language = session.language ?? "en";
  const copy = getUiCopy(language);
  const isChinese = language === "zh-CN";
  const strongestFor = session.evidence[0]
    ? [
        {
          text: isChinese
            ? `共享证据中已经出现《${session.evidence[0].title}》。`
            : `Shared evidence already surfaced ${session.evidence[0].title}.`,
          evidenceIds: [session.evidence[0].id]
        }
      ]
    : [
        {
          text: isChinese
            ? "在手动停止辩论前还没有收集到证据。"
            : "No evidence had been gathered before the debate was manually stopped.",
          evidenceIds: []
        }
      ];

  const strongestAgainst = session.turns.length
    ? [
        {
          text: isChinese
            ? `在停止前，辩论已经进行到 ${session.turns.length} 个回合。`
            : `The debate had reached ${session.turns.length} turn${session.turns.length === 1 ? "" : "s"} before stopping.`,
          evidenceIds: session.turns.flatMap((turn) => turn.referencedEvidenceIds)
        }
      ]
    : [
        {
          text: isChinese
            ? "在停止前还没有形成反驳内容。"
            : "No rebuttals were captured before the debate was manually stopped.",
          evidenceIds: []
        }
      ];

  return {
    strongestFor,
    strongestAgainst,
    coreDisagreement: isChinese
      ? `会话在${copy.sessionStageLabels[session.stage]}阶段被手动停止。`
      : `The debate was manually stopped while the session was in ${session.stage} stage.`,
    keyUncertainty: isChinese
      ? `当前问题仍未解决：${session.question}`
      : `The underlying question remains unresolved: ${session.question}`,
    nextAction:
      session.stage === "research"
        ? isChinese
          ? "继续研究，或恢复辩论以完善决策判断。"
          : "Resume research or continue the debate to refine the decision."
        : isChinese
          ? "恢复辩论，继续收敛最强论点与下一步建议。"
          : "Resume the debate to refine the strongest arguments and next step."
  };
}

function normalizePremise(premise: unknown) {
  if (typeof premise !== "string") {
    throw new Error("Invalid premise");
  }

  const normalizedPremise = premise.trim();
  if (normalizedPremise.length === 0) {
    throw new Error("Invalid premise");
  }

  return normalizedPremise;
}

function getSessionOrThrow(sessionId: string) {
  const session = store.get(sessionId);
  if (!session) {
    throw new Error("Session not found");
  }

  return session;
}

async function advanceSessionStep(sessionId: string) {
  const session = getSessionOrThrow(sessionId);
  const { service: researchService } = getResearchService();

  if (session.stage === "research") {
    let previewItems: ResearchProgressView["previewItems"] = [];
    store.save({
      ...cloneSession(session),
      researchProgress: buildProgressFromPreviewItems(previewItems, {
        stage: "searching-sources",
        evidence: session.evidence
      })
    });

    const evidence = await researchService.buildSharedEvidence(session.question, {
      onResultsFound: async (results) => {
        previewItems = results.slice(0, 5).map((result) => ({
          title: result.title,
          sourceName: result.sourceName,
          status: "found"
        }));
        store.save({
          ...cloneSession(getSessionOrThrow(sessionId)),
          researchProgress: buildProgressFromPreviewItems(previewItems, {
            stage: "searching-sources",
            evidence: getSessionOrThrow(sessionId).evidence
          })
        });
      },
      onEvidenceBuilt: async (built, result) => {
        const current = getSessionOrThrow(sessionId);
        const nextEvidence = [...current.evidence, built];
        previewItems = previewItems.map((item) =>
          item.title === result.title && item.sourceName === result.sourceName
            ? { ...item, status: "used" }
            : item
        );

        store.save({
          ...cloneSession(current),
          evidence: nextEvidence,
          researchProgress: buildProgressFromPreviewItems(previewItems, {
            stage: "extracting-evidence",
            evidence: nextEvidence
          })
        });
      }
    });

    const current = getSessionOrThrow(sessionId);
    return store.save({
      ...cloneSession(current),
      evidence,
      stage: "opening",
      researchProgress: buildProgressFromPreviewItems(previewItems, {
        stage: "preparing-opening",
        evidence
      }),
      diagnosis: undefined
    });
  }

  if (session.stage === "opening") {
    const nextTurn = await generateNextTurn(session);
    const nextTurns = [...session.turns, nextTurn];

    return store.save({
      ...cloneSession(session),
      turns: nextTurns,
      stage: nextTurns.length >= 2 ? "debate" : "opening",
      diagnosis: undefined
    });
  }

  if (session.stage === "debate") {
    if (session.turns.length >= session.config.roundCount * 2) {
      const summary = await createSummaryService(createSummaryCompletion(session)).generate(session);
      return store.save({
        ...cloneSession(session),
        summary,
        stage: "complete",
        diagnosis: undefined
      });
    }

    const evidence = await buildDebateEvidenceWithFallback(sessionId, session);
    const nextTurn = await generateNextTurn({ ...session, evidence });
    const nextTurns = [...session.turns, nextTurn];

    return store.save({
      ...cloneSession(session),
      evidence,
      turns: nextTurns,
      researchProgress: buildResearchProgressView(evidence),
      diagnosis: undefined
    });
  }

  return session;
}

function startSessionRunner(sessionId: string) {
  if (process.env.NODE_ENV === "test") {
    return;
  }

  if (activeSessionRunners.has(sessionId)) {
    return;
  }

  const runner = (async () => {
    try {
      while (true) {
        const current = getSessionOrThrow(sessionId);
        if (current.stage === "complete") {
          return;
        }

        await advanceSessionStep(sessionId);
      }
    } catch (error) {
      persistDiagnosis(sessionId, error);
    } finally {
      activeSessionRunners.delete(sessionId);
    }
  })();

  activeSessionRunners.set(sessionId, runner);
}

export const runtime = {
  async createSession(input: unknown) {
    const parsed = createSessionInputSchema.parse(input);
    const provider = resolveDeepSeekProviderConfig(parsed.model);

    const session = await orchestrator.createSession({
      question: parsed.question,
      presetSelection: parsed.presetSelection,
      firstSpeaker: parsed.firstSpeaker,
      language: parsed.language,
      premise: parsed.premise,
      config: {
        ...parsed.config,
        provider
      }
    });

    startSessionRunner(session.id);

    return redactSessionForClient({
      ...session,
      config: {
        ...session.config,
        provider
      }
    });
  },
  async continueSession(sessionId: string) {
    try {
      const next = await advanceSessionStep(sessionId);
      return redactSessionForClient(next);
    } catch (error) {
      persistDiagnosis(sessionId, error);
      throw error;
    }
  },
  async getSession(sessionId: string) {
    return redactSessionForClient(getSessionOrThrow(sessionId));
  },
  async addPremise(sessionId: string, premise: unknown) {
    const session = getSessionOrThrow(sessionId);
    return redactSessionForClient(store.save({ ...cloneSession(session), premise: normalizePremise(premise) }));
  },
  async stopSession(sessionId: string) {
    const session = getSessionOrThrow(sessionId);
    if (session.stage === "complete") {
      return redactSessionForClient(session);
    }

    return redactSessionForClient(store.save({
      ...cloneSession(session),
      summary: session.summary ?? createStoppedSummary(session),
      stage: "complete"
    }));
  }
};
