import type { SessionInput, SessionView } from "@/components/session-shell";
import { loadHistoryFolderState } from "@/lib/history-folder-store";

type WritableFileHandle = FileSystemFileHandle & {
  createWritable(): Promise<{
    write(contents: string): Promise<void>;
    close(): Promise<void>;
  }>;
};

export type HistoryRecordMeta = Pick<
  SessionInput,
  "question" | "presetSelection" | "firstSpeaker" | "language" | "model"
> & {
  createdAt: string;
  searchEngine: string;
};

function padTimestampPart(value: number) {
  return String(value).padStart(2, "0");
}

export function buildHistoryFileName(sessionId: string, createdAt: string) {
  const date = new Date(createdAt);

  return `dualens-${date.getUTCFullYear()}${padTimestampPart(date.getUTCMonth() + 1)}${padTimestampPart(date.getUTCDate())}-${padTimestampPart(date.getUTCHours())}${padTimestampPart(date.getUTCMinutes())}${padTimestampPart(date.getUTCSeconds())}-${sessionId}.json`;
}

export function serializeHistoryRecord(
  meta: HistoryRecordMeta,
  session: SessionView
) {
  return {
    id: session.id,
    debateMode: session.debateMode,
    createdAt: meta.createdAt,
    updatedAt: new Date().toISOString(),
    question: meta.question,
    model: meta.model,
    searchEngine: meta.searchEngine,
    presetSelection: meta.presetSelection,
    firstSpeaker: meta.firstSpeaker,
    language: meta.language,
    stage: session.stage,
    evidence: session.evidence,
    privateEvidence: session.privateEvidence ?? {},
    researchProgress: session.researchProgress,
    turns: session.turns,
    summary: session.summary,
    diagnosis: session.diagnosis
  };
}

export async function persistSessionHistory(
  meta: HistoryRecordMeta & { sessionId: string },
  session: SessionView
) {
  const folderState = await loadHistoryFolderState();

  if (folderState.status !== "authorized" || !folderState.handle) {
    return {
      status: "skipped" as const
    };
  }

  try {
    const fileName = buildHistoryFileName(meta.sessionId, meta.createdAt);
    const fileHandle = (await folderState.handle.getFileHandle(fileName, {
      create: true
    })) as WritableFileHandle;
    const writable = await fileHandle.createWritable();

    await writable.write(
      JSON.stringify(serializeHistoryRecord(meta, session), null, 2)
    );
    await writable.close();

    return {
      status: "written" as const,
      fileName
    };
  } catch {
    return {
      status: "error" as const
    };
  }
}
