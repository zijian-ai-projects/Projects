import { NextResponse } from "next/server";
import { runtime } from "@/server/runtime";
import { authorizeSessionRequest } from "@/server/session-auth";

export async function GET(request: Request, context: { params: Promise<{ sessionId: string }> }) {
  try {
    const { sessionId } = await context.params;
    const authorization = authorizeSessionRequest(request, sessionId);
    if (!authorization.authorized) {
      return NextResponse.json({ error: authorization.error }, { status: authorization.status });
    }

    const session = await runtime.getSession(sessionId);
    return NextResponse.json(session);
  } catch (error) {
    if (error instanceof Error && error.message === "Session not found") {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
