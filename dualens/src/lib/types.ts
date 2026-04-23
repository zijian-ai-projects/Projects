export type SourceStrategy = "credible-first" | "full-web";
export type SummaryStyle = "balanced" | "concise" | "actionable";
export type BuiltInModel = "deepseek-chat" | "deepseek-reasoner";
export type SearchEngineId = "bing" | "baidu" | "google" | "tavily";
export type OpenAICompatibleProviderConfig = {
  baseUrl: string;
  apiKey: string;
  model: string;
};
export type SearchEngineRuntimeConfig = {
  engineId: SearchEngineId;
  apiKey: string;
  endpoint: string;
  engineIdentifier?: string;
  extra?: string;
};

export type DiagnosticCategory =
  | "auth"
  | "model"
  | "endpoint-shape"
  | "network"
  | "timeout"
  | "unknown";

export type UiLanguage = "en" | "zh-CN";
export type DebateLanguage = "en" | "zh-CN";
export type AppLanguage = DebateLanguage;
export type SideIdentityKey = "lumina" | "vigila";
export type SpeakerSideKey = SideIdentityKey;
export type TemperamentOption =
  | "cautious"
  | "aggressive"
  | "rational"
  | "intuitive"
  | "cost-focused"
  | "benefit-focused"
  | "short-term"
  | "long-term";
export type TemperamentPairId =
  | "cautious-aggressive"
  | "rational-intuitive"
  | "cost-benefit"
  | "short-long";
export type SideIdentity = {
  key: SideIdentityKey;
  name: Record<UiLanguage, string>;
  descriptor: Record<UiLanguage, string>;
};
export type TemperamentPair = {
  id: TemperamentPairId;
  labels: Record<UiLanguage, string>;
  options: readonly [TemperamentOption, TemperamentOption];
};
type DebatePresetSelectionByPairId = {
  "cautious-aggressive": {
    pairId: "cautious-aggressive";
    luminaTemperament: "cautious" | "aggressive";
  };
  "rational-intuitive": {
    pairId: "rational-intuitive";
    luminaTemperament: "rational" | "intuitive";
  };
  "cost-benefit": {
    pairId: "cost-benefit";
    luminaTemperament: "cost-focused" | "benefit-focused";
  };
  "short-long": {
    pairId: "short-long";
    luminaTemperament: "short-term" | "long-term";
  };
};
export type DebatePresetSelection =
  DebatePresetSelectionByPairId[keyof DebatePresetSelectionByPairId];
export type SessionStage =
  | "idle"
  | "research"
  | "opening"
  | "debate"
  | "complete";

export type SessionDiagnosisStage = Exclude<SessionStage, "idle">;

export type SessionDiagnosis = {
  stage: SessionDiagnosisStage;
  failingStep: string;
  providerBaseUrl: string;
  providerModel: string;
  category: DiagnosticCategory;
  summary: string;
  detail?: string;
  suggestedFix: string;
};

export type SessionDiagnosisContext = {
  stage: SessionDiagnosisStage;
  step: string;
  baseUrl: string;
  model: string;
};

export type SessionConfig = {
  sourceStrategy: SourceStrategy;
  searchDepth: "quick" | "standard" | "deep";
  roundCount: number;
  summaryStyle: SummaryStyle;
  provider: OpenAICompatibleProviderConfig;
  searchProvider?: SearchEngineRuntimeConfig;
};

export type SessionConfigDefaults = Pick<
  SessionConfig,
  "sourceStrategy" | "searchDepth" | "roundCount" | "summaryStyle"
>;

export type SessionCreateInput = {
  question: string;
  presetSelection: DebatePresetSelection;
  firstSpeaker?: SpeakerSideKey;
  language?: AppLanguage;
  premise?: string;
  model: string;
  providerConfig?: OpenAICompatibleProviderConfig;
  searchConfig?: SearchEngineRuntimeConfig;
  config?: Partial<SessionConfig>;
};

export type Evidence = {
  id: string;
  title: string;
  url: string;
  sourceName: string;
  sourceType: string;
  summary: string;
  dataPoints?: string[];
};

export type DebateTurn = {
  id: string;
  speaker: string;
  content: string;
  referencedEvidenceIds: string[];
};

export type DebateSummaryPoint = {
  text: string;
  evidenceIds: string[];
};

export type DebateSummary = {
  strongestFor: DebateSummaryPoint[];
  strongestAgainst: DebateSummaryPoint[];
  coreDisagreement: string;
  keyUncertainty: string;
  nextAction: string;
};

export type ResearchProgressStage =
  | "preparing-query"
  | "searching-sources"
  | "reading-pages"
  | "extracting-evidence"
  | "preparing-opening";

export type ResearchPreviewItem = {
  title: string;
  sourceName: string;
  status: "found" | "read" | "used";
};

export type ResearchProgressView = {
  stage: ResearchProgressStage;
  sourceCount: number;
  evidenceCount: number;
  previewItems: ResearchPreviewItem[];
};

export function buildResearchProgressView(
  evidence: Evidence[],
  options: {
    stage?: ResearchProgressStage;
    previewLimit?: number;
    previewStatus?: ResearchPreviewItem["status"];
  } = {}
): ResearchProgressView {
  const stage = options.stage ?? "preparing-opening";
  const previewLimit = options.previewLimit ?? 5;
  const previewStatus = options.previewStatus ?? "used";
  const sourceCount = new Set(evidence.map((item) => item.sourceName)).size;

  return {
    stage,
    sourceCount,
    evidenceCount: evidence.length,
    previewItems: evidence.slice(0, previewLimit).map((item) => ({
      title: item.title,
      sourceName: item.sourceName,
      status: previewStatus
    }))
  };
}

export type SessionRecord = {
  id: string;
  ownerTokenHash?: string;
  question: string;
  presetSelection: DebatePresetSelection;
  firstSpeaker: SpeakerSideKey;
  language?: AppLanguage;
  premise?: string;
  stage: SessionStage;
  config: SessionConfig;
  evidence: Evidence[];
  researchProgress?: ResearchProgressView;
  diagnosis?: SessionDiagnosis;
  turns: DebateTurn[];
  summary?: DebateSummary;
};
