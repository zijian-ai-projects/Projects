import { NextResponse } from "next/server";
import { runtime } from "@/server/runtime";
import { createSessionStore } from "@/server/session-store";
import type { SessionDiagnosis } from "@/lib/types";

const sessionStore = createSessionStore();
const SESSION_DIAGNOSIS_STAGES = new Set(["research", "opening", "debate", "complete"] as const);
const DIAGNOSTIC_CATEGORIES = new Set([
  "auth",
  "model",
  "endpoint-shape",
  "network",
  "timeout",
  "unknown"
] as const);

function isSessionDiagnosisStage(value: unknown): value is SessionDiagnosis["stage"] {
  return typeof value === "string" && SESSION_DIAGNOSIS_STAGES.has(value as SessionDiagnosis["stage"]);
}

function isDiagnosticCategory(value: unknown): value is SessionDiagnosis["category"] {
  return typeof value === "string" && DIAGNOSTIC_CATEGORIES.has(value as SessionDiagnosis["category"]);
}

function isSessionDiagnosis(value: unknown): value is SessionDiagnosis {
  return (
    typeof value === "object" &&
    value !== null &&
    isSessionDiagnosisStage((value as SessionDiagnosis).stage) &&
    typeof (value as SessionDiagnosis).failingStep === "string" &&
    typeof (value as SessionDiagnosis).providerBaseUrl === "string" &&
    typeof (value as SessionDiagnosis).providerModel === "string" &&
    isDiagnosticCategory((value as SessionDiagnosis).category) &&
    typeof (value as SessionDiagnosis).summary === "string" &&
    typeof (value as SessionDiagnosis).suggestedFix === "string"
  );
}

export async function POST(_: Request, context: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await context.params;

  try {
    const session = await runtime.continueSession(sessionId);
    return NextResponse.json(session);
  } catch (error) {
    if (error instanceof Error && error.message === "Session not found") {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const errorDiagnosis =
      error instanceof Error && isSessionDiagnosis((error as Error & { diagnosis?: unknown }).diagnosis)
        ? (error as Error & { diagnosis: SessionDiagnosis }).diagnosis
        : undefined;
    const persistedDiagnosis = isSessionDiagnosis(sessionStore.get(sessionId)?.diagnosis)
      ? sessionStore.get(sessionId)?.diagnosis
      : undefined;
    const diagnosis = errorDiagnosis ?? persistedDiagnosis;

    return NextResponse.json(
      {
        error: error instanceof Error && error.message.trim().length > 0 ? error.message : "Unexpected error",
        ...(diagnosis ? { diagnosis } : {})
      },
      { status: 500 }
    );
  }
}
