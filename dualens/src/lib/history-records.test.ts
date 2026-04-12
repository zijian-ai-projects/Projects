import { beforeEach, describe, expect, it, vi } from "vitest";
import { serializeHistoryRecord } from "@/lib/history-file-writer";
import type { HistoryRecordMeta } from "@/lib/history-file-writer";
import type { SessionView } from "@/components/session-shell";

const { loadHistoryFolderState } = vi.hoisted(() => ({
  loadHistoryFolderState: vi.fn()
}));

vi.mock("@/lib/history-folder-store", () => ({
  loadHistoryFolderState
}));

import {
  deleteHistoryRecordFile,
  loadHistoryRecords
} from "@/lib/history-records";

function createMeta(overrides: Partial<HistoryRecordMeta> = {}): HistoryRecordMeta {
  return {
    createdAt: "2026-04-10T14:28:00.000Z",
    question: "是否应该在今年转去独立开发？",
    presetSelection: {
      pairId: "cautious-aggressive",
      luminaTemperament: "cautious"
    },
    firstSpeaker: "lumina",
    language: "zh-CN",
    model: "deepseek-chat",
    searchEngine: "Tavily",
    ...overrides
  };
}

function createSession(overrides: Partial<SessionView> = {}): SessionView {
  return {
    id: "session-1",
    stage: "complete",
    evidence: [],
    turns: [],
    summary: {
      strongestFor: [],
      strongestAgainst: [],
      coreDisagreement: "核心分歧",
      keyUncertainty: "关键不确定性",
      nextAction: "下一步"
    },
    ...overrides
  };
}

function createFileHandle(name: string, contents: string) {
  return {
    kind: "file",
    name,
    async getFile() {
      return {
        async text() {
          return contents;
        }
      };
    }
  };
}

function createDirectoryHandle(entries: Array<ReturnType<typeof createFileHandle>>) {
  const removed: string[] = [];

  return {
    name: "history",
    removed,
    async *values() {
      for (const entry of entries) {
        yield entry;
      }
    },
    async removeEntry(name: string) {
      removed.push(name);
    }
  };
}

describe("history record loading", () => {
  beforeEach(() => {
    loadHistoryFolderState.mockReset();
  });

  it("loads valid JSON history records from the selected folder and sorts newest first", async () => {
    const older = serializeHistoryRecord(
      createMeta({
        createdAt: "2026-04-09T08:10:00.000Z",
        question: "Should I move to another city?",
        language: "en"
      }),
      createSession({ id: "session-old", stage: "debate", summary: undefined })
    );
    const newer = serializeHistoryRecord(
      createMeta({
        createdAt: "2026-04-10T14:28:00.000Z",
        question: "是否应该在今年转去独立开发？"
      }),
      createSession({ id: "session-new" })
    );
    const folder = createDirectoryHandle([
      createFileHandle("ignore.txt", "{}"),
      createFileHandle("older.json", JSON.stringify(older)),
      createFileHandle("broken.json", "{"),
      createFileHandle("newer.json", JSON.stringify(newer))
    ]);

    loadHistoryFolderState.mockResolvedValue({
      status: "authorized",
      folderName: "history",
      handle: folder
    });

    const result = await loadHistoryRecords();

    expect(result.status).toBe("authorized");
    expect(result.records).toHaveLength(2);
    expect(result.records.map((record) => record.fileName)).toEqual(["newer.json", "older.json"]);
    expect(result.records[0]).toMatchObject({
      id: "session-new",
      question: "是否应该在今年转去独立开发？",
      createdAt: "2026-04-10 14:28",
      model: "deepseek-chat",
      roleSummary: "谨慎 / 激进",
      status: "complete"
    });
    expect(result.records[1]).toMatchObject({
      id: "session-old",
      question: "Should I move to another city?",
      roleSummary: "Cautious / Aggressive",
      status: "running"
    });
  });

  it("marks records with a diagnosis as failed before completion", async () => {
    const failed = serializeHistoryRecord(
      createMeta(),
      createSession({
        id: "session-failed",
        stage: "opening",
        summary: undefined,
        diagnosis: {
          stage: "opening",
          failingStep: "run-opening-round",
          providerBaseUrl: "https://api.deepseek.com",
          providerModel: "deepseek-chat",
          category: "auth",
          summary: "Authentication failed.",
          suggestedFix: "Check the API key."
        }
      })
    );
    const folder = createDirectoryHandle([
      createFileHandle("failed.json", JSON.stringify(failed))
    ]);

    loadHistoryFolderState.mockResolvedValue({
      status: "authorized",
      folderName: "history",
      handle: folder
    });

    const result = await loadHistoryRecords();

    expect(result.records[0]?.status).toBe("failed");
  });

  it("loads records when optional debate detail fields are partial", async () => {
    const legacyRecord = {
      ...serializeHistoryRecord(createMeta(), createSession({ id: "session-legacy" })),
      evidence: [{ id: "bad-evidence" }],
      turns: "not-an-array",
      summary: {
        coreDisagreement: "旧版核心分歧",
        keyUncertainty: "旧版关键不确定性",
        nextAction: "旧版下一步"
      }
    };
    const folder = createDirectoryHandle([
      createFileHandle("legacy.json", JSON.stringify(legacyRecord))
    ]);

    loadHistoryFolderState.mockResolvedValue({
      status: "authorized",
      folderName: "history",
      handle: folder
    });

    const result = await loadHistoryRecords();

    expect(result.records).toHaveLength(1);
    expect(result.records[0]).toMatchObject({
      id: "session-legacy",
      debateMode: "shared-evidence",
      privateEvidence: {},
      evidence: [],
      turns: [],
      evidenceCount: 0,
      turnCount: 0,
      summary: {
        strongestFor: [],
        strongestAgainst: [],
        coreDisagreement: "旧版核心分歧",
        keyUncertainty: "旧版关键不确定性",
        nextAction: "旧版下一步"
      }
    });
  });

  it("deletes a history JSON file from the selected folder", async () => {
    const folder = createDirectoryHandle([]);

    loadHistoryFolderState.mockResolvedValue({
      status: "authorized",
      folderName: "history",
      handle: folder
    });

    const result = await deleteHistoryRecordFile("session.json");

    expect(result.status).toBe("deleted");
    expect(folder.removed).toEqual(["session.json"]);
  });
});
