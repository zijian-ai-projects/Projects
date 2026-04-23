import { NextResponse } from "next/server";
import { runtime } from "@/server/runtime";
import { authorizeSessionRequest } from "@/server/session-auth";

function isInvalidPremiseError(error: unknown) {
  return error instanceof Error && error.message === "Invalid premise";
}

function isMissingSessionError(error: unknown) {
  return error instanceof Error && error.message === "Session not found";
}

export async function POST(request: Request, context: { params: Promise<{ sessionId: string }> }) {
  try {
    const { sessionId } = await context.params;
    const authorization = authorizeSessionRequest(request, sessionId);
    if (!authorization.authorized) {
      return NextResponse.json({ error: authorization.error }, { status: authorization.status });
    }

    const body = await request.json();
    const session = await runtime.addPremise(sessionId, body?.premise);
    return NextResponse.json(session);
  } catch (error) {
    if (isMissingSessionError(error)) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (isInvalidPremiseError(error) || error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid premise" }, { status: 400 });
    }

    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
