import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { runtime } from "@/server/runtime";
import type { SessionDiagnosis } from "@/lib/types";

function isClientInputError(error: unknown) {
  return error instanceof ZodError || error instanceof SyntaxError;
}

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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const session = await runtime.createSession(body);
    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    if (isClientInputError(error)) {
      return NextResponse.json({ error: "Invalid session input" }, { status: 400 });
    }

    const diagnosis = error instanceof Error && isSessionDiagnosis((error as Error & { diagnosis?: unknown }).diagnosis)
      ? (error as Error & { diagnosis: SessionDiagnosis }).diagnosis
      : undefined;

    return NextResponse.json(
      {
        error: error instanceof Error && error.message.trim().length > 0 ? error.message : "Unexpected error",
        ...(diagnosis ? { diagnosis } : {})
      },
      { status: 500 }
    );
  }
}
