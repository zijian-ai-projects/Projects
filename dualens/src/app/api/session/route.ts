import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { runtime } from "@/server/runtime";
import {
  createSessionOwnerToken,
  hashSessionOwnerToken,
  setSessionOwnerCookie
} from "@/server/session-auth";
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
const DEFAULT_SESSION_CREATE_RATE_LIMIT_MAX = 30;
const SESSION_CREATE_RATE_LIMIT_WINDOW_MS = 60_000;
const sessionCreateRateLimits = new Map<string, { count: number; resetAt: number }>();

function getConfiguredRateLimitMax() {
  const rawValue = process.env.DUALENS_SESSION_RATE_LIMIT_MAX;
  const parsed = rawValue ? Number(rawValue) : DEFAULT_SESSION_CREATE_RATE_LIMIT_MAX;

  return Number.isInteger(parsed) && parsed > 0 ? parsed : DEFAULT_SESSION_CREATE_RATE_LIMIT_MAX;
}

function getClientRateLimitKey(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "anonymous"
  );
}

function isSessionApiTokenValid(request: Request) {
  const expectedToken = process.env.DUALENS_SESSION_API_TOKEN?.trim();
  if (!expectedToken) {
    return false;
  }

  return (
    request.headers.get("authorization")?.trim() === `Bearer ${expectedToken}` ||
    request.headers.get("x-dualens-session-token")?.trim() === expectedToken
  );
}

function isAnonymousProductionSessionAllowed(request: Request) {
  if (process.env.NODE_ENV !== "production") {
    return true;
  }

  return process.env.DUALENS_ALLOW_ANONYMOUS_SESSIONS === "1" || isSessionApiTokenValid(request);
}

function isSessionCreateRateLimited(request: Request) {
  const now = Date.now();
  const key = getClientRateLimitKey(request);
  const existing = sessionCreateRateLimits.get(key);
  const current = existing && existing.resetAt > now
    ? existing
    : { count: 0, resetAt: now + SESSION_CREATE_RATE_LIMIT_WINDOW_MS };

  current.count += 1;
  sessionCreateRateLimits.set(key, current);

  return current.count > getConfiguredRateLimitMax();
}

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
  if (!isAnonymousProductionSessionAllowed(request)) {
    return NextResponse.json({ error: "Anonymous session creation is disabled" }, { status: 403 });
  }

  if (isSessionCreateRateLimited(request)) {
    return NextResponse.json({ error: "Too many session creation requests" }, { status: 429 });
  }

  try {
    const body = await request.json();
    const ownerToken = createSessionOwnerToken();
    const session = await runtime.createSession(body, {
      ownerTokenHash: hashSessionOwnerToken(ownerToken)
    });
    const response = NextResponse.json(session, { status: 201 });

    setSessionOwnerCookie(response, session.id, ownerToken);

    return response;
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
