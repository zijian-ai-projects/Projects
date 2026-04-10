"use client";

import { SessionShell } from "@/components/session-shell";
import { createSession } from "@/app/session-client";

export default function HomePage() {
  return <SessionShell createSession={createSession} />;
}
