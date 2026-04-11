"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode
} from "react";

type DebateQuestionDraftValue = {
  question: string;
  setQuestion(question: string): void;
};

const DebateQuestionDraftContext = createContext<DebateQuestionDraftValue | null>(null);

export function DebateQuestionDraftProvider({ children }: { children: ReactNode }) {
  const [question, setQuestion] = useState("");
  const value = useMemo(
    () => ({
      question,
      setQuestion
    }),
    [question]
  );

  return (
    <DebateQuestionDraftContext.Provider value={value}>
      {children}
    </DebateQuestionDraftContext.Provider>
  );
}

export function useOptionalDebateQuestionDraft() {
  return useContext(DebateQuestionDraftContext);
}
