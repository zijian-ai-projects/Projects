"use client";

import type { SessionInput, SessionView } from "@/components/session-shell";
import type { SessionDiagnosis } from "@/lib/types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
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
    isRecord(value) &&
    isSessionDiagnosisStage(value.stage) &&
    typeof value.failingStep === "string" &&
    typeof value.providerBaseUrl === "string" &&
    typeof value.providerModel === "string" &&
    isDiagnosticCategory(value.category) &&
    typeof value.summary === "string" &&
    typeof value.suggestedFix === "string"
  );
}

function isSessionViewResponse(value: unknown): value is SessionView {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.stage === "string" &&
    Array.isArray(value.evidence) &&
    Array.isArray(value.turns)
  );
}

async function readErrorResponse(response: Response) {
  try {
    const body = (await response.json()) as unknown;
    if (isRecord(body)) {
      const error = new Error(
        typeof body.error === "string" && body.error.trim().length > 0 ? body.error : "Failed to create session"
      ) as Error & { diagnosis?: SessionDiagnosis };

      if (isSessionDiagnosis(body.diagnosis)) {
        error.diagnosis = body.diagnosis;
      }

      return error;
    }
  } catch {
    // Ignore non-JSON error bodies and fall back below.
  }

  return new Error("Failed to create session") as Error & { diagnosis?: SessionDiagnosis };
}

export async function createSession(input: SessionInput): Promise<SessionView> {
  const response = await fetch("/api/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    throw await readErrorResponse(response);
  }

  const session = (await response.json()) as unknown;
  if (!isSessionViewResponse(session)) {
    throw new Error("Invalid session response");
  }

  return session;
}
