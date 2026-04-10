import type { ResearchProgressStage, SessionDiagnosisStage, SessionStage, UiLanguage } from "@/lib/types";

type UiCopy = {
  appTitle: string;
  heroTitle: string;
  heroLead: string;
  decisionQuestion: string;
  questionPlaceholder: string;
  debatePreset: string;
  chooseTemperamentPair: string;
  swapTemperamentAssignment: string;
  swapButtonText: string;
  speakingOrderFirst: string;
  speakingOrderSecond: string;
  startDebate: string;
  startingDebate: string;
  uiLanguageLabel: string;
  model: string;
  english: string;
  chinese: string;
  workspaceTitle: string;
  workspaceDescription: string;
  sessionDiagnosisTitle: string;
  sessionDiagnosisStageHeadlines: Record<SessionDiagnosisStage, string>;
  sessionDiagnosisSummaryLabel: string;
  sessionDiagnosisDetailLabel: string;
  sessionDiagnosisStepLabel: string;
  sessionDiagnosisEndpointLabel: string;
  sessionDiagnosisModelLabel: string;
  sessionDiagnosisCategoryLabel: string;
  sessionDiagnosisSuggestedFixLabel: string;
  workspaceActiveStatus: string;
  workspaceCompleteStatus: string;
  sessionStageLabels: Record<SessionStage, string>;
  researchProgressTitle: string;
  researchProgressStageLabels: Record<ResearchProgressStage, string>;
  sourceLabel: string;
  evidenceLabel: string;
  sourceCountOne: string;
  sourceCountMany: string;
  evidenceCountOne: string;
  evidenceCountMany: string;
  stopDebate: string;
  stopping: string;
  unableToStartDebate: string;
  unableToAdvanceDebate: string;
  unableToStopDebate: string;
  sessionErrors: {
    start: string;
    advance: string;
    stop: string;
  };
  debateWorkspaceLabel: string;
  debateTimelineTitle: string;
  debateTimelineEmptyState: string;
  turnLabel: string;
  evidenceReferenceLabel: string;
  sharedEvidenceTitle: string;
  evidencePreviewTitle: string;
  evidencePanelEmptyState: string;
  evidencePreviewFound: string;
  evidencePreviewRead: string;
  evidencePreviewUsed: string;
  summaryTitle: string;
  summaryDescription: string;
  summaryEmptyDescription: string;
  summaryEmptyState: string;
  summaryStrongestFor: string;
  summaryStrongestAgainst: string;
  summaryCoreDisagreement: string;
  summaryKeyUncertainty: string;
  summaryNextAction: string;
  summaryNoItemsYet: string;
  summaryNoContentYet: string;
  summaryEvidenceLabel: string;
  summaryEvidenceNone: string;
};

export const UI_COPY: Record<UiLanguage, UiCopy> = {
  en: {
    appTitle: "Dualens",
    heroTitle: "Dualens",
    heroLead: "One question. Two lenses. Evidence stays visible.",
    decisionQuestion: "Decision question",
    questionPlaceholder: "Should I move to another city for a job?",
    debatePreset: "Temperament pair",
    chooseTemperamentPair: "Choose temperament pair",
    swapTemperamentAssignment: "Swap temperament assignment",
    swapButtonText: "swap",
    speakingOrderFirst: "First",
    speakingOrderSecond: "Second",
    startDebate: "Start debate",
    startingDebate: "Starting...",
    uiLanguageLabel: "UI language",
    model: "Model",
    english: "English",
    chinese: "中文",
    workspaceTitle: "",
    workspaceDescription: "",
    sessionDiagnosisTitle: "Session diagnosis",
    sessionDiagnosisStageHeadlines: {
      research: "Generation failed while preparing research.",
      opening: "Generation failed while preparing opening arguments.",
      debate: "Generation failed while preparing debate turns.",
      complete: "Generation failed while preparing the final summary."
    },
    sessionDiagnosisSummaryLabel: "Summary",
    sessionDiagnosisDetailLabel: "Detail",
    sessionDiagnosisStepLabel: "Failing step",
    sessionDiagnosisEndpointLabel: "Provider",
    sessionDiagnosisModelLabel: "Model",
    sessionDiagnosisCategoryLabel: "Category",
    sessionDiagnosisSuggestedFixLabel: "Suggested fix",
    workspaceActiveStatus: "Research and debate remain visible as the session progresses.",
    workspaceCompleteStatus: "The final summary is locked in.",
    sessionStageLabels: {
      idle: "Idle",
      research: "Research in progress",
      opening: "Opening positions",
      debate: "Debate in progress",
      complete: "Summary ready"
    },
    researchProgressTitle: "Research progress",
    researchProgressStageLabels: {
      "preparing-query": "Preparing query",
      "searching-sources": "Searching sources",
      "reading-pages": "Reading pages",
      "extracting-evidence": "Extracting evidence",
      "preparing-opening": "Preparing opening"
    },
    sourceLabel: "Sources",
    evidenceLabel: "Evidence",
    sourceCountOne: "1 source found",
    sourceCountMany: "{count} sources found",
    evidenceCountOne: "1 evidence item extracted",
    evidenceCountMany: "{count} evidence items extracted",
    stopDebate: "Stop debate",
    stopping: "Stopping...",
    unableToStartDebate: "Unable to start debate.",
    unableToAdvanceDebate: "Unable to advance debate.",
    unableToStopDebate: "Unable to stop debate.",
    sessionErrors: {
      start: "Unable to start debate.",
      advance: "Unable to advance debate.",
      stop: "Unable to stop debate."
    },
    debateWorkspaceLabel: "Debate workspace",
    debateTimelineTitle: "Debate timeline",
    debateTimelineEmptyState:
      "The opening positions and rebuttals will appear here after research finishes and the first turns are drafted.",
    turnLabel: "Turn",
    evidenceReferenceLabel: "Evidence",
    sharedEvidenceTitle: "Shared evidence",
    evidencePreviewTitle: "Evidence preview",
    evidencePanelEmptyState:
      "Shared evidence will collect here as research discovers sources for both sides.",
    evidencePreviewFound: "Found",
    evidencePreviewRead: "Read",
    evidencePreviewUsed: "Used",
    summaryTitle: "Decision summary",
    summaryDescription:
      "The final synthesis keeps the strongest arguments, uncertainties, and next step visible.",
    summaryEmptyDescription: "The final synthesis appears after the debate is complete.",
    summaryEmptyState:
      "Research is still in progress. Strongest arguments, uncertainties, and next steps will collect here when the session closes.",
    summaryStrongestFor: "Strongest for",
    summaryStrongestAgainst: "Strongest against",
    summaryCoreDisagreement: "Core disagreement",
    summaryKeyUncertainty: "Key uncertainty",
    summaryNextAction: "Next action",
    summaryNoItemsYet: "No items yet.",
    summaryNoContentYet: "No content yet.",
    summaryEvidenceLabel: "Evidence",
    summaryEvidenceNone: "Evidence: none"
  },
  "zh-CN": {
    appTitle: "两仪决",
    heroTitle: "两仪决",
    heroLead: "一个问题，两种视角，证据始终可见。",
    decisionQuestion: "决策问题",
    questionPlaceholder: "我应该为了工作搬到另一个城市吗？",
    debatePreset: "性格配对",
    chooseTemperamentPair: "选择性格配对",
    swapTemperamentAssignment: "交换个性分配",
    swapButtonText: "换",
    speakingOrderFirst: "先",
    speakingOrderSecond: "后",
    startDebate: "开始辩论",
    startingDebate: "正在开始...",
    uiLanguageLabel: "界面语言",
    model: "模型",
    english: "English",
    chinese: "中文",
    workspaceTitle: "",
    workspaceDescription: "",
    sessionDiagnosisTitle: "会话诊断",
    sessionDiagnosisStageHeadlines: {
      research: "生成在准备研究时失败。",
      opening: "生成在准备开场论点时失败。",
      debate: "生成在准备辩论回合时失败。",
      complete: "生成在准备最终总结时失败。"
    },
    sessionDiagnosisSummaryLabel: "摘要",
    sessionDiagnosisDetailLabel: "详情",
    sessionDiagnosisStepLabel: "失败步骤",
    sessionDiagnosisEndpointLabel: "提供方",
    sessionDiagnosisModelLabel: "模型",
    sessionDiagnosisCategoryLabel: "类别",
    sessionDiagnosisSuggestedFixLabel: "建议修复",
    workspaceActiveStatus: "随着会话推进，研究和辩论仍会保持可见。",
    workspaceCompleteStatus: "最终总结已经锁定。",
    sessionStageLabels: {
      idle: "空闲",
      research: "研究进行中",
      opening: "开场立场",
      debate: "辩论进行中",
      complete: "总结已就绪"
    },
    researchProgressTitle: "研究进度",
    researchProgressStageLabels: {
      "preparing-query": "准备问题",
      "searching-sources": "搜索来源",
      "reading-pages": "阅读页面",
      "extracting-evidence": "提取证据",
      "preparing-opening": "准备开场"
    },
    sourceLabel: "来源",
    evidenceLabel: "证据",
    sourceCountOne: "发现 1 个来源",
    sourceCountMany: "发现 {count} 个来源",
    evidenceCountOne: "提取 1 条证据",
    evidenceCountMany: "提取 {count} 条证据",
    stopDebate: "停止辩论",
    stopping: "正在停止...",
    unableToStartDebate: "无法开始辩论。",
    unableToAdvanceDebate: "无法推进辩论。",
    unableToStopDebate: "无法停止辩论。",
    sessionErrors: {
      start: "无法开始辩论。",
      advance: "无法推进辩论。",
      stop: "无法停止辩论。"
    },
    debateWorkspaceLabel: "辩论工作区",
    debateTimelineTitle: "辩论时间线",
    debateTimelineEmptyState:
      "当研究结束并完成首轮发言后，开场立场和反驳将显示在这里。",
    turnLabel: "回合",
    evidenceReferenceLabel: "证据",
    sharedEvidenceTitle: "共享证据",
    evidencePreviewTitle: "证据预览",
    evidencePanelEmptyState: "随着研究发现双方来源，共享证据会汇集在这里。",
    evidencePreviewFound: "发现",
    evidencePreviewRead: "已阅读",
    evidencePreviewUsed: "已使用",
    summaryTitle: "决策总结",
    summaryDescription: "最终综合结论会保留最强论点、关键不确定性和下一步。",
    summaryEmptyDescription: "辩论完成后会显示最终综合结论。",
    summaryEmptyState:
      "研究仍在进行中。最强论点、关键不确定性和下一步行动会在会话结束时汇集在这里。",
    summaryStrongestFor: "最强支持",
    summaryStrongestAgainst: "最强反对",
    summaryCoreDisagreement: "核心分歧",
    summaryKeyUncertainty: "关键不确定性",
    summaryNextAction: "下一步行动",
    summaryNoItemsYet: "暂无条目。",
    summaryNoContentYet: "暂无内容。",
    summaryEvidenceLabel: "证据",
    summaryEvidenceNone: "证据：无"
  }
} as const;

export function getUiCopy(language: UiLanguage) {
  return UI_COPY[language];
}

export const UI_LANGUAGE_OPTIONS = ["en", "zh-CN"] as const satisfies readonly UiLanguage[];
