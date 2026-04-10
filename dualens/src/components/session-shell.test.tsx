import "@testing-library/jest-dom/vitest";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const { persistSessionHistory } = vi.hoisted(() => ({
  persistSessionHistory: vi.fn(async () => ({ status: "written" as const }))
}));

vi.mock("@/lib/history-file-writer", () => ({
  persistSessionHistory
}));

import { SessionShell, type SessionView } from "@/components/session-shell";

afterEach(() => {
  vi.restoreAllMocks();
  persistSessionHistory.mockClear();
  window.localStorage.clear();
});

function setupUser() {
  return userEvent.setup();
}

function buildSession(overrides: Partial<SessionView> & Pick<SessionView, "id" | "stage">): SessionView {
  return {
    id: overrides.id,
    stage: overrides.stage,
    evidence: overrides.evidence ?? [],
    turns: overrides.turns ?? [],
    summary: overrides.summary,
    researchProgress: overrides.researchProgress,
    diagnosis: overrides.diagnosis
  };
}

describe("SessionShell", () => {
  it("submits the expected payload and advances to the summary workspace", async () => {
    const user = setupUser();
    const createSession = vi.fn().mockResolvedValue(
      buildSession({
        id: "s1",
        stage: "research",
        researchProgress: {
          stage: "preparing-opening",
          sourceCount: 3,
          evidenceCount: 1,
          previewItems: []
        }
      })
    );
    const continueSession = vi.fn().mockResolvedValue(
      buildSession({
        id: "s1",
        stage: "complete",
        evidence: [
          {
            id: "e1",
            title: "Housing market outlook",
            url: "https://example.com/housing",
            sourceName: "Example News",
            sourceType: "news",
            summary: "Real summary",
            dataPoints: ["Real data point"]
          }
        ],
        turns: [
          {
            id: "t1",
            speaker: "Cautious",
            content: "Protect downside first.",
            referencedEvidenceIds: ["e1"]
          }
        ],
        summary: {
          strongestFor: [{ text: "Upside exists.", evidenceIds: ["e1"] }],
          strongestAgainst: [{ text: "Risk remains high.", evidenceIds: ["e1"] }],
          coreDisagreement: "Whether upside outweighs downside.",
          keyUncertainty: "Local market conditions.",
          nextAction: "Collect more local salary data."
        },
        researchProgress: {
          stage: "preparing-opening",
          sourceCount: 3,
          evidenceCount: 1,
          previewItems: []
        }
      })
    );

    render(
      <SessionShell
        uiLanguage="en"
        createSession={createSession}
        continueSession={continueSession}
      />
    );

    await user.type(screen.getByLabelText("Decision question"), "Should I move to another city?");
    await user.click(screen.getByRole("button", { name: "Start debate" }));

    expect(createSession).toHaveBeenCalledWith({
      question: "Should I move to another city?",
      presetSelection: {
        pairId: "cautious-aggressive",
        luminaTemperament: "cautious"
      },
      firstSpeaker: "lumina",
      language: "en",
      model: "deepseek-chat"
    });

    await waitFor(() => {
      expect(continueSession).toHaveBeenCalledWith("s1");
    });

    expect(await screen.findByText("Decision summary")).toBeInTheDocument();
    expect(screen.getByText("Collect more local salary data.")).toBeInTheDocument();
  });

  it("submits vigila as first speaker after toggling the speaking order", async () => {
    const user = setupUser();
    const createSession = vi.fn().mockResolvedValue(
      buildSession({
        id: "s1",
        stage: "research"
      })
    );

    render(<SessionShell uiLanguage="en" createSession={createSession} continueSession={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Second" }));
    await user.type(screen.getByLabelText("Decision question"), "Should I stay in this city?");
    await user.click(screen.getByRole("button", { name: "Start debate" }));

    expect(createSession).toHaveBeenCalledWith(
      expect.objectContaining({
        firstSpeaker: "vigila"
      })
    );
  });

  it("shows the combined start error when create-session fails", async () => {
    const user = setupUser();
    const createSession = vi.fn().mockRejectedValue(new Error("Invalid session input"));

    render(<SessionShell uiLanguage="en" createSession={createSession} />);

    await user.type(screen.getByLabelText("Decision question"), "Should I move to another city?");
    await user.click(screen.getByRole("button", { name: "Start debate" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Unable to start debate. Invalid session input"
    );
  });

  it("shows the combined advance error when polling fails", async () => {
    const user = setupUser();
    const createSession = vi.fn().mockResolvedValue(
      buildSession({
        id: "s1",
        stage: "research"
      })
    );
    const continueSession = vi.fn().mockRejectedValue(new Error("Backend unavailable"));

    render(
      <SessionShell
        uiLanguage="en"
        createSession={createSession}
        continueSession={continueSession}
      />
    );

    await user.type(screen.getByLabelText("Decision question"), "Should I move to another city?");
    await user.click(screen.getByRole("button", { name: "Start debate" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Unable to advance debate. Backend unavailable"
    );
  });

  it("stops an active session before completion", async () => {
    const user = setupUser();
    const createSession = vi.fn().mockResolvedValue(
      buildSession({
        id: "s1",
        stage: "debate"
      })
    );
    const continueSession = vi.fn(
      () =>
        new Promise<SessionView>(() => {
          // Keep the session active while the stop action is exercised.
        })
    );
    const stopSession = vi.fn().mockResolvedValue(
      buildSession({
        id: "s1",
        stage: "complete"
      })
    );

    render(
      <SessionShell
        uiLanguage="en"
        createSession={createSession}
        continueSession={continueSession}
        stopSession={stopSession}
      />
    );

    await user.type(screen.getByLabelText("Decision question"), "Should I move to another city?");
    await user.click(screen.getByRole("button", { name: "Start debate" }));
    await user.click(await screen.findByRole("button", { name: "Stop debate" }));

    await waitFor(() => {
      expect(stopSession).toHaveBeenCalledWith("s1");
    });
    await waitFor(() => {
      expect(screen.queryByRole("button", { name: "Stop debate" })).not.toBeInTheDocument();
    });
  });

  it("writes a snapshot after create and after the session reaches completion", async () => {
    const user = setupUser();
    const createSession = vi.fn().mockResolvedValueOnce(
      buildSession({
        id: "session-1",
        stage: "research"
      })
    );
    const continueSession = vi.fn().mockResolvedValueOnce(
      buildSession({
        id: "session-1",
        stage: "complete",
        summary: undefined
      })
    );

    window.localStorage.setItem("dualens:selectedSearchEngineId", "google");

    render(
      <SessionShell
        createSession={createSession}
        continueSession={continueSession}
        uiLanguage="en"
      />
    );

    await user.type(
      screen.getByLabelText("Decision question"),
      "Should I move to Shanghai this year?"
    );
    await user.click(screen.getByRole("button", { name: "Start debate" }));

    await waitFor(() => {
      expect(persistSessionHistory).toHaveBeenCalledTimes(2);
    });

    expect(persistSessionHistory).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        sessionId: "session-1",
        question: "Should I move to Shanghai this year?",
        model: "deepseek-chat",
        searchEngine: "Google"
      }),
      expect.objectContaining({
        id: "session-1",
        stage: "research"
      })
    );
  });
});
