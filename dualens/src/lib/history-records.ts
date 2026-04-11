import { loadHistoryFolderState, type HistoryFolderStatus } from "@/lib/history-folder-store";
import {
  getLocalizedTemperamentOptionLabel,
  getOppositeTemperament,
  getTemperamentPairById
} from "@/lib/presets";
import type {
  AppLanguage,
  DebatePresetSelection,
  SessionDiagnosis,
  SessionStage,
  TemperamentOption
} from "@/lib/types";

type HistoryStatus = "complete" | "running" | "failed";

export type HistoryListRecord = {
  id: string;
  fileName: string;
  question: string;
  createdAt: string;
  createdAtIso: string;
  model: string;
  roleSummary: string;
  status: HistoryStatus;
};

type StoredHistoryRecord = {
  id: string;
  createdAt: string;
  question: string;
  model: string;
  presetSelection: DebatePresetSelection;
  language?: AppLanguage;
  stage: SessionStage;
  diagnosis?: SessionDiagnosis;
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

function isStoredHistoryRecord(value: unknown): value is StoredHistoryRecord {
  if (!isRecord(value) || !isRecord(value.presetSelection)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.createdAt === "string" &&
    typeof value.question === "string" &&
    typeof value.model === "string" &&
    typeof value.presetSelection.pairId === "string" &&
    typeof value.presetSelection.luminaTemperament === "string" &&
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

function getHistoryStatus(record: StoredHistoryRecord): HistoryStatus {
  if (record.diagnosis && record.stage !== "complete") {
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

    return {
      id: parsed.id,
      fileName: fileHandle.name,
      question: parsed.question,
      createdAt: formatHistoryDate(parsed.createdAt),
      createdAtIso: parsed.createdAt,
      model: parsed.model,
      roleSummary: getRoleSummary(parsed),
      status: getHistoryStatus(parsed)
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
