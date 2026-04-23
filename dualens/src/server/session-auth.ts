import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { NextResponse } from "next/server";
import { createSessionStore } from "@/server/session-store";
import type { SessionRecord } from "@/lib/types";

export const SESSION_OWNER_COOKIE_NAME = "dualens_session_owner";

const SESSION_OWNER_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
const processLocalCookieSecret = randomBytes(32).toString("hex");

type SessionAuthFailure = {
  authorized: false;
  status: 401 | 403 | 404;
  error: string;
};

type SessionAuthSuccess = {
  authorized: true;
  session: SessionRecord;
};

export type SessionAuthorization = SessionAuthFailure | SessionAuthSuccess;

function getCookieSecret() {
  return (
    process.env.DUALENS_SESSION_OWNER_SECRET?.trim() ||
    process.env.DUALENS_SESSION_API_TOKEN?.trim() ||
    processLocalCookieSecret
  );
}

function timingSafeStringEqual(a: string, b: string) {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);

  return aBuffer.length === bBuffer.length && timingSafeEqual(aBuffer, bBuffer);
}

function signOwnerToken(sessionId: string, token: string) {
  return createHmac("sha256", getCookieSecret())
    .update(`${sessionId}.${token}`)
    .digest("base64url");
}

function getCookieValue(request: Request) {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) {
    return undefined;
  }

  for (const part of cookieHeader.split(";")) {
    const [name, ...valueParts] = part.trim().split("=");
    if (name === SESSION_OWNER_COOKIE_NAME) {
      return decodeURIComponent(valueParts.join("="));
    }
  }

  return undefined;
}

function parseOwnerCookie(value: string) {
  const [sessionId, token, signature] = value.split(".");
  if (!sessionId || !token || !signature) {
    return undefined;
  }

  const expectedSignature = signOwnerToken(sessionId, token);
  if (!timingSafeStringEqual(signature, expectedSignature)) {
    return undefined;
  }

  return {
    sessionId,
    token
  };
}

export function createSessionOwnerToken() {
  return randomBytes(32).toString("base64url");
}

export function hashSessionOwnerToken(token: string) {
  return createHash("sha256").update(token).digest("base64url");
}

export function createSessionOwnerCookieValue(sessionId: string, token: string) {
  return `${sessionId}.${token}.${signOwnerToken(sessionId, token)}`;
}

export function setSessionOwnerCookie(response: NextResponse, sessionId: string, token: string) {
  response.cookies.set({
    name: SESSION_OWNER_COOKIE_NAME,
    value: createSessionOwnerCookieValue(sessionId, token),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/api/session",
    maxAge: SESSION_OWNER_COOKIE_MAX_AGE_SECONDS
  });
}

export function authorizeSessionRequest(request: Request, sessionId: string): SessionAuthorization {
  const session = createSessionStore().get(sessionId);
  if (!session) {
    return {
      authorized: false,
      status: 404,
      error: "Session not found"
    };
  }

  const cookieValue = getCookieValue(request);
  if (!cookieValue) {
    return {
      authorized: false,
      status: 401,
      error: "Missing session owner credentials"
    };
  }

  const parsedCookie = parseOwnerCookie(cookieValue);
  if (!parsedCookie) {
    return {
      authorized: false,
      status: 401,
      error: "Invalid session owner credentials"
    };
  }

  if (parsedCookie.sessionId !== sessionId) {
    return {
      authorized: false,
      status: 403,
      error: "Session owner mismatch"
    };
  }

  if (
    !session.ownerTokenHash ||
    !timingSafeStringEqual(hashSessionOwnerToken(parsedCookie.token), session.ownerTokenHash)
  ) {
    return {
      authorized: false,
      status: 403,
      error: "Session owner mismatch"
    };
  }

  return {
    authorized: true,
    session
  };
}
