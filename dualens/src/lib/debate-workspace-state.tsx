"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction
} from "react";
import type { SessionView } from "@/components/session-shell";
import type { HistoryRecordMeta } from "@/lib/history-file-writer";
import type { DebatePresetSelection, SpeakerSideKey } from "@/lib/types";

export type SessionErrorKind = "start" | "advance" | "stop";
export type HistorySaveStatus = "idle" | "written" | "skipped" | "error";

export type ActiveHistoryMeta = HistoryRecordMeta & { sessionId: string };

type DebateWorkspaceStateValue = {
  question: string;
  setQuestion: Dispatch<SetStateAction<string>>;
  session: SessionView | null;
  setSession: Dispatch<SetStateAction<SessionView | null>>;
  historyMeta: ActiveHistoryMeta | null;
  setHistoryMeta: Dispatch<SetStateAction<ActiveHistoryMeta | null>>;
  errorKind: SessionErrorKind | null;
  setErrorKind: Dispatch<SetStateAction<SessionErrorKind | null>>;
  errorDetail: string | null;
  setErrorDetail: Dispatch<SetStateAction<string | null>>;
  isStopping: boolean;
  setIsStopping: Dispatch<SetStateAction<boolean>>;
  historySaveStatus: HistorySaveStatus;
  setHistorySaveStatus: Dispatch<SetStateAction<HistorySaveStatus>>;
  draftPresetSelection: DebatePresetSelection | null;
  setDraftPresetSelection: Dispatch<SetStateAction<DebatePresetSelection | null>>;
  draftFirstSpeaker: SpeakerSideKey | null;
  setDraftFirstSpeaker: Dispatch<SetStateAction<SpeakerSideKey | null>>;
};

const DebateWorkspaceStateContext = createContext<DebateWorkspaceStateValue | null>(null);

export function DebateWorkspaceStateProvider({ children }: { children: ReactNode }) {
  const [question, setQuestion] = useState("");
  const [session, setSession] = useState<SessionView | null>(null);
  const [historyMeta, setHistoryMeta] = useState<ActiveHistoryMeta | null>(null);
  const [errorKind, setErrorKind] = useState<SessionErrorKind | null>(null);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const [isStopping, setIsStopping] = useState(false);
  const [historySaveStatus, setHistorySaveStatus] = useState<HistorySaveStatus>("idle");
  const [draftPresetSelection, setDraftPresetSelection] = useState<DebatePresetSelection | null>(null);
  const [draftFirstSpeaker, setDraftFirstSpeaker] = useState<SpeakerSideKey | null>(null);

  const value = useMemo(
    () => ({
      question,
      setQuestion,
      session,
      setSession,
      historyMeta,
      setHistoryMeta,
      errorKind,
      setErrorKind,
      errorDetail,
      setErrorDetail,
      isStopping,
      setIsStopping,
      historySaveStatus,
      setHistorySaveStatus,
      draftPresetSelection,
      setDraftPresetSelection,
      draftFirstSpeaker,
      setDraftFirstSpeaker
    }),
    [
      draftFirstSpeaker,
      draftPresetSelection,
      errorDetail,
      errorKind,
      historyMeta,
      historySaveStatus,
      isStopping,
      question,
      session
    ]
  );

  return (
    <DebateWorkspaceStateContext.Provider value={value}>
      {children}
    </DebateWorkspaceStateContext.Provider>
  );
}

export function useOptionalDebateWorkspaceState() {
  return useContext(DebateWorkspaceStateContext);
}
