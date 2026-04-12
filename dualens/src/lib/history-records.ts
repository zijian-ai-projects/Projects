import { loadHistoryFolderState, type HistoryFolderStatus } from "@/lib/history-folder-store";
import {
  getLocalizedTemperamentOptionLabel,
  getOppositeTemperament,
  getTemperamentPairById
} from "@/lib/presets";
import type {
  AppLanguage,
  DebateMode,
  DebateTurn,
  DebateSummary,
  DebatePresetSelection,
  Evidence,
  PrivateEvidencePools,
  SessionDiagnosis,
  SessionStage,
  SpeakerSideKey,
  TemperamentOption
} from "@/lib/types";

type HistoryStatus = "complete" | "running" | "failed";

export type HistoryListRecord = {
  id: string;
  fileName: string;
  debateMode: DebateMode;
  question: string;
  createdAt: string;
  createdAtIso: string;
  model: string;
  searchEngine: string;
  roleSummary: string;
  status: HistoryStatus;
  stage: SessionStage;
  language: AppLanguage;
  presetSelection: DebatePresetSelection;
  firstSpeaker: SpeakerSideKey;
  evidence: Evidence[];
  privateEvidence: PrivateEvidencePools;
  turns: DebateTurn[];
  evidenceCount: number;
  turnCount: number;
  summary?: DebateSummary;
  diagnosis?: SessionDiagnosis;
};

type StoredHistoryRecord = {
  id: string;
  debateMode?: DebateMode;
  createdAt: string;
  question: string;
  model: string;
  searchEngine?: string;
  presetSelection: DebatePresetSelection;
  firstSpeaker?: SpeakerSideKey;
  language?: AppLanguage;
  stage: SessionStage;
  evidence?: unknown;
  privateEvidence?: unknown;
  turns?: unknown;
  summary?: unknown;
  diagnosis?: unknown;
};

type HistoryLoadStatus = HistoryFolderStatus | "error";

type HistoryLoadResult = {
  status: HistoryLoadStatus;
  records: HistoryListRecord[];
};

type ReadableFileHandle = FileSystemFileHandle & {
  kind: "file";
  getFile(): Promise<{
    text(): Promise<string>;
  }>;
};

type IterableDirectoryHandle = FileSystemDirectoryHandle & {
  values(): AsyncIterable<FileSystemFileHandle | FileSystemDirectoryHandle>;
  removeEntry(name: string): Promise<void>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isAppLanguage(value: unknown): value is AppLanguage {
  return value === "zh-CN" || value === "en";
}

function isSessionStage(value: unknown): value is SessionStage {
  return (
    value === "idle" ||
    value === "research" ||
    value === "opening" ||
    value === "debate" ||
    value === "complete"
  );
}

function isSpeakerSideKey(value: unknown): value is SpeakerSideKey {
  return value === "lumina" || value === "vigila";
}

function isDebateMode(value: unknown): value is DebateMode {
  return value === "shared-evidence" || value === "private-evidence";
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isEvidence(value: unknown): value is Evidence {
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

function isDebateTurn(value: unknown): value is DebateTurn {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.speaker === "string" &&
    typeof value.content === "string" &&
    isStringArray(value.referencedEvidenceIds) &&
    (value.side === undefined || isSpeakerSideKey(value.side)) &&
    (value.round === undefined || typeof value.round === "number") &&
    (value.privateEvidenceIds === undefined || isStringArray(value.privateEvidenceIds)) &&
    (value.analysis === undefined ||
      (isRecord(value.analysis) &&
        isStringArray(value.analysis.factualIssues) &&
        isStringArray(value.analysis.logicalIssues) &&
        isStringArray(value.analysis.valueIssues) &&
        typeof value.analysis.searchFocus === "string"))
  );
}

function isSummaryPoint(value: unknown): value is DebateSummary["strongestFor"][number] {
  return isRecord(value) && typeof value.text === "string" && isStringArray(value.evidenceIds);
}

function isDebateSummary(value: unknown): value is DebateSummary {
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

function getEvidenceList(value: unknown): Evidence[] {
  return Array.isArray(value) ? value.filter(isEvidence) : [];
}

function getPrivateEvidencePools(value: unknown): PrivateEvidencePools {
  if (!isRecord(value)) {
    return {};
  }

  return Object.entries(value).reduce<PrivateEvidencePools>((pools, [side, evidence]) => {
    if (!isSpeakerSideKey(side)) {
      return pools;
    }

    const evidenceList = getEvidenceList(evidence);
    if (evidenceList.length > 0) {
      pools[side] = evidenceList;
    }

    return pools;
  }, {});
}

function getDebateTurns(value: unknown): DebateTurn[] {
  return Array.isArray(value) ? value.filter(isDebateTurn) : [];
}

function getDebateSummary(value: unknown): DebateSummary | undefined {
  if (isDebateSummary(value)) {
    return value;
  }

  if (
    isRecord(value) &&
    typeof value.coreDisagreement === "string" &&
    typeof value.keyUncertainty === "string" &&
    typeof value.nextAction === "string"
  ) {
    const strongestFor = Array.isArray(value.strongestFor)
      ? value.strongestFor.filter(isSummaryPoint)
      : [];
    const strongestAgainst = Array.isArray(value.strongestAgainst)
      ? value.strongestAgainst.filter(isSummaryPoint)
      : [];

    return {
      strongestFor,
      strongestAgainst,
      coreDisagreement: value.coreDisagreement,
      keyUncertainty: value.keyUncertainty,
      nextAction: value.nextAction
    };
  }

  return undefined;
}

function isSessionDiagnosis(value: unknown): value is SessionDiagnosis {
  return (
    isRecord(value) &&
    isSessionStage(value.stage) &&
    value.stage !== "idle" &&
    typeof value.failingStep === "string" &&
    typeof value.providerBaseUrl === "string" &&
    typeof value.providerModel === "string" &&
    typeof value.category === "string" &&
    typeof value.summary === "string" &&
    typeof value.suggestedFix === "string"
  );
}

function isStoredHistoryRecord(value: unknown): value is StoredHistoryRecord {
  if (!isRecord(value) || !isRecord(value.presetSelection)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.createdAt === "string" &&
    typeof value.question === "string" &&
    typeof value.model === "string" &&
    (value.debateMode === undefined || isDebateMode(value.debateMode)) &&
    (value.searchEngine === undefined || typeof value.searchEngine === "string") &&
    typeof value.presetSelection.pairId === "string" &&
    typeof value.presetSelection.luminaTemperament === "string" &&
    (value.firstSpeaker === undefined || isSpeakerSideKey(value.firstSpeaker)) &&
    isSessionStage(value.stage) &&
    (value.language === undefined || isAppLanguage(value.language))
  );
}

function isJsonFileHandle(entry: FileSystemFileHandle | FileSystemDirectoryHandle): entry is ReadableFileHandle {
  return entry.kind === "file" && entry.name.toLowerCase().endsWith(".json");
}

function formatHistoryDate(isoDate: string) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }

  const pad = (value: number) => String(value).padStart(2, "0");

  return [
    `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`,
    `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`
  ].join(" ");
}

function getHistoryStatus(record: StoredHistoryRecord, diagnosis?: SessionDiagnosis): HistoryStatus {
  if (diagnosis && record.stage !== "complete") {
    return "failed";
  }

  return record.stage === "complete" ? "complete" : "running";
}

function getRoleSummary(record: StoredHistoryRecord) {
  const language = record.language ?? "zh-CN";
  const pair = getTemperamentPairById(record.presetSelection.pairId);

  if (!pair) {
    return record.presetSelection.pairId;
  }

  const luminaTemperament = record.presetSelection.luminaTemperament as TemperamentOption;
  const vigilaTemperament = getOppositeTemperament(pair, luminaTemperament);

  return [
    getLocalizedTemperamentOptionLabel(luminaTemperament, language),
    getLocalizedTemperamentOptionLabel(vigilaTemperament, language)
  ].join(" / ");
}

async function readHistoryFile(fileHandle: ReadableFileHandle): Promise<HistoryListRecord | null> {
  try {
    const file = await fileHandle.getFile();
    const parsed = JSON.parse(await file.text()) as unknown;
    if (!isStoredHistoryRecord(parsed)) {
      return null;
    }

    const evidence = getEvidenceList(parsed.evidence);
    const privateEvidence = getPrivateEvidencePools(parsed.privateEvidence);
    const turns = getDebateTurns(parsed.turns);
    const summary = getDebateSummary(parsed.summary);
    const diagnosis = isSessionDiagnosis(parsed.diagnosis) ? parsed.diagnosis : undefined;

    return {
      id: parsed.id,
      fileName: fileHandle.name,
      debateMode: parsed.debateMode ?? "shared-evidence",
      question: parsed.question,
      createdAt: formatHistoryDate(parsed.createdAt),
      createdAtIso: parsed.createdAt,
      model: parsed.model,
      searchEngine: parsed.searchEngine ?? "Tavily",
      roleSummary: getRoleSummary(parsed),
      status: getHistoryStatus(parsed, diagnosis),
      stage: parsed.stage,
      language: parsed.language ?? "zh-CN",
      presetSelection: parsed.presetSelection,
      firstSpeaker: parsed.firstSpeaker ?? "lumina",
      evidence,
      privateEvidence,
      turns,
      evidenceCount: evidence.length,
      turnCount: turns.length,
      summary,
      diagnosis
    };
  } catch {
    return null;
  }
}

export async function loadHistoryRecords(): Promise<HistoryLoadResult> {
  const folderState = await loadHistoryFolderState();

  if (folderState.status !== "authorized" || !folderState.handle) {
    return {
      status: folderState.status,
      records: []
    };
  }

  try {
    const records: HistoryListRecord[] = [];

    for await (const entry of (folderState.handle as IterableDirectoryHandle).values()) {
      if (!isJsonFileHandle(entry)) {
        continue;
      }

      const record = await readHistoryFile(entry);
      if (record) {
        records.push(record);
      }
    }

    return {
      status: "authorized",
      records: records.sort(
        (a, b) => new Date(b.createdAtIso).getTime() - new Date(a.createdAtIso).getTime()
      )
    };
  } catch {
    return {
      status: "error",
      records: []
    };
  }
}

export async function deleteHistoryRecordFile(fileName: string) {
  const folderState = await loadHistoryFolderState();

  if (folderState.status !== "authorized" || !folderState.handle) {
    return {
      status: "skipped" as const
    };
  }

  try {
    await (folderState.handle as IterableDirectoryHandle).removeEntry(fileName);
    return {
      status: "deleted" as const
    };
  } catch {
    return {
      status: "error" as const
    };
  }
}
