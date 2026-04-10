import type { SessionRecord } from "@/lib/types";

const globalForSessionStore = globalThis as typeof globalThis & {
  __twoAgentDebateSessionStore?: Map<string, SessionRecord>;
};

export function createSessionStore() {
  const sessions = globalForSessionStore.__twoAgentDebateSessionStore ?? new Map<string, SessionRecord>();
  globalForSessionStore.__twoAgentDebateSessionStore = sessions;

  return {
    get(id: string) {
      return sessions.get(id);
    },
    save(session: SessionRecord) {
      sessions.set(session.id, session);
      return session;
    }
  };
}
