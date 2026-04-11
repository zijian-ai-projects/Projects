import { randomUUID } from "node:crypto";
import { DEFAULT_SESSION_CONFIG } from "@/lib/presets";
import { buildResearchProgressView } from "@/lib/types";
import type {
  ResearchProgressView,
  SessionCreateInput,
  SessionRecord
} from "@/lib/types";

type SessionStore = {
  get(id: string): SessionRecord | undefined;
  save(session: SessionRecord): SessionRecord;
};

type OrchestratorDeps = {
  runSharedResearch(session: SessionRecord): Promise<SessionRecord["evidence"]>;
  runOpeningRound(session: SessionRecord): Promise<SessionRecord>;
  runDebateRound(session: SessionRecord): Promise<SessionRecord>;
  runSummary(session: SessionRecord): Promise<NonNullable<SessionRecord["summary"]>>;
};

function cloneSession(session: SessionRecord): SessionRecord {
  return structuredClone(session);
}

function buildResearchProgress(session: SessionRecord): ResearchProgressView {
  return buildResearchProgressView(session.evidence);
}

export function createOrchestrator(store: SessionStore, deps: OrchestratorDeps) {
  return {
    async createSession(input: unknown) {
      const parsed = input as {
        question: SessionCreateInput["question"];
        presetSelection: SessionRecord["presetSelection"];
        firstSpeaker?: SessionCreateInput["firstSpeaker"];
        language?: SessionRecord["language"];
        premise?: string;
        config?: Partial<SessionRecord["config"]>;
      };
      const config = { ...DEFAULT_SESSION_CONFIG, ...parsed.config } as SessionRecord["config"];
      const session: SessionRecord = {
        id: randomUUID(),
        debateMode: config.debateMode,
        question: parsed.question,
        presetSelection: parsed.presetSelection,
        firstSpeaker: parsed.firstSpeaker ?? "lumina",
        language: parsed.language,
        premise: parsed.premise,
        stage: "research",
        config,
        evidence: [],
        privateEvidence: {},
        turns: []
      };

      return store.save(session);
    },
    async continueSession(id: string) {
      const session = store.get(id);
      if (!session) {
        throw new Error("Session not found");
      }

      if (session.stage === "research") {
        const evidence = await deps.runSharedResearch(cloneSession(session));
        return store.save({
          ...session,
          evidence,
          researchProgress: buildResearchProgress({ ...session, evidence }),
          stage: "opening"
        });
      }

      if (session.stage === "opening") {
        const next = await deps.runOpeningRound(cloneSession(session));
        if (next.id !== session.id) {
          throw new Error("Opening round returned a different session id");
        }
        return store.save({ ...next, stage: "debate" });
      }

      if (session.stage === "debate") {
        if (session.turns.length >= session.config.roundCount * 2) {
          const summary = await deps.runSummary(cloneSession(session));
          return store.save({ ...session, summary, stage: "complete" });
        }

        const next = await deps.runDebateRound(cloneSession(session));
        if (next.id !== session.id) {
          throw new Error("Debate round returned a different session id");
        }
        return store.save(next);
      }

      return session;
    }
  };
}
