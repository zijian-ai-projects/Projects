import "@testing-library/jest-dom/vitest";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useState } from "react";

const { persistSessionHistory } = vi.hoisted(() => ({
  persistSessionHistory: vi.fn(async () => ({ status: "written" as const }))
}));

vi.mock("@/lib/history-file-writer", () => ({
  persistSessionHistory
}));

import { SessionShell, type SessionView } from "@/components/session-shell";
import { DebateWorkspaceStateProvider } from "@/lib/debate-workspace-state";
import { DebateQuestionDraftProvider } from "@/lib/debate-question-draft";

afterEach(() => {
  vi.restoreAllMocks();
  persistSessionHistory.mockClear();
  window.localStorage.clear();
});

function setupUser() {
  return userEvent.setup();
}

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((nextResolve, nextReject) => {
    resolve = nextResolve;
    reject = nextReject;
  });

  return { promise, resolve, reject };
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

  it("submits the selected configured provider runtime config when starting debate", async () => {
    const user = setupUser();
    const createSession = vi.fn().mockResolvedValue(
      buildSession({
        id: "s-provider",
        stage: "research"
      })
    );

    window.localStorage.setItem("dualens:selectedModelProviderId", "openai");
    window.localStorage.setItem(
      "dualens:modelProviderConfigs",
      JSON.stringify({
        openai: {
          providerId: "openai",
          apiKey: "client-openai-key",
          modelId: "gpt-4.1",
          endpoint: "https://api.openai.com/v1",
          extra: ""
        }
      })
    );

    render(<SessionShell uiLanguage="en" createSession={createSession} continueSession={vi.fn()} />);

    await user.type(screen.getByLabelText("Decision question"), "Should I move to another city?");
    await user.click(screen.getByRole("button", { name: "Start debate" }));

    expect(createSession).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gpt-4.1",
        providerConfig: {
          baseUrl: "https://api.openai.com/v1",
          apiKey: "client-openai-key",
          model: "gpt-4.1"
        }
      })
    );
  });

  it("submits the selected configured search engine runtime config when starting debate", async () => {
    const user = setupUser();
    const createSession = vi.fn().mockResolvedValue(
      buildSession({
        id: "s-search",
        stage: "research"
      })
    );

    window.localStorage.setItem("dualens:selectedSearchEngineId", "tavily");
    window.localStorage.setItem(
      "dualens:searchEngineConfigs",
      JSON.stringify({
        tavily: {
          searchEngineId: "tavily",
          apiKey: "client-tavily-key",
          engineIdentifier: "",
          endpoint: "https://api.tavily.com/search",
          extra: ""
        }
      })
    );

    render(<SessionShell uiLanguage="en" createSession={createSession} continueSession={vi.fn()} />);

    await user.type(screen.getByLabelText("Decision question"), "Should I move to another city?");
    await user.click(screen.getByRole("button", { name: "Start debate" }));

    expect(createSession).toHaveBeenCalledWith(
      expect.objectContaining({
        searchConfig: {
          engineId: "tavily",
          apiKey: "client-tavily-key",
          endpoint: "https://api.tavily.com/search",
          engineIdentifier: undefined,
          extra: undefined
        }
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

  it("shows persisted diagnosis details when polling returns a diagnosed session", async () => {
    const user = setupUser();
    const createSession = vi.fn().mockResolvedValue(
      buildSession({
        id: "s-diagnosis",
        stage: "research"
      })
    );
    const continueSession = vi.fn().mockResolvedValue(
      buildSession({
        id: "s-diagnosis",
        stage: "opening",
        diagnosis: {
          stage: "opening",
          failingStep: "run-opening-round",
          providerBaseUrl: "https://api.openai.com/v1",
          providerModel: "gpt-4.1",
          category: "endpoint-shape",
          summary: "The provider returned a response with the wrong shape.",
          detail: "Model response for DebateTurn was not valid JSON",
          suggestedFix: "Check whether the endpoint supports OpenAI-compatible chat completions."
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

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Unable to advance debate. The provider returned a response with the wrong shape. Check whether the endpoint supports OpenAI-compatible chat completions."
    );
    expect(screen.getByRole("region", { name: "Session diagnosis" })).toBeInTheDocument();
    expect(screen.getByText("https://api.openai.com/v1")).toBeInTheDocument();
    expect(screen.getByText("gpt-4.1")).toBeInTheDocument();
    expect(screen.getByText("Model response for DebateTurn was not valid JSON")).toBeInTheDocument();
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

  it("captures the search-engine label before createSession resolves", async () => {
    const user = setupUser();
    const createSessionDeferred = createDeferred<SessionView>();
    const createSession = vi.fn(() => createSessionDeferred.promise);

    window.localStorage.setItem("dualens:selectedSearchEngineId", "google");

    render(<SessionShell createSession={createSession} continueSession={vi.fn()} uiLanguage="en" />);

    await user.type(
      screen.getByLabelText("Decision question"),
      "Should I move to Shanghai this year?"
    );
    await user.click(screen.getByRole("button", { name: "Start debate" }));

    window.localStorage.setItem("dualens:selectedSearchEngineId", "bing");
    createSessionDeferred.resolve(
      buildSession({
        id: "session-2",
        stage: "research"
      })
    );

    await waitFor(() => {
      expect(persistSessionHistory).toHaveBeenCalledTimes(1);
    });

    expect(persistSessionHistory).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: "session-2",
        searchEngine: "Google"
      }),
      expect.objectContaining({
        id: "session-2"
      })
    );
  });

  it("waits for the previous history write before persisting the next snapshot", async () => {
    const user = setupUser();
    const firstWriteDeferred = createDeferred<{ status: "written" }>();
    const createSession = vi.fn().mockResolvedValueOnce(
      buildSession({
        id: "session-3",
        stage: "research"
      })
    );
    const continueSession = vi.fn().mockResolvedValueOnce(
      buildSession({
        id: "session-3",
        stage: "complete"
      })
    );

    persistSessionHistory
      .mockImplementationOnce(() => firstWriteDeferred.promise)
      .mockImplementationOnce(async () => ({ status: "written" as const }));

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
      expect(continueSession).toHaveBeenCalledWith("session-3");
    });

    expect(await screen.findByText("Summary ready")).toBeInTheDocument();
    expect(persistSessionHistory).toHaveBeenCalledTimes(1);

    firstWriteDeferred.resolve({ status: "written" });

    await waitFor(() => {
      expect(persistSessionHistory).toHaveBeenCalledTimes(2);
    });
  });

  it("preserves an active debate session when the debate page unmounts inside the workspace", async () => {
    const user = setupUser();
    const createSession = vi.fn().mockResolvedValue(
      buildSession({
        id: "active-session-1",
        stage: "research",
        researchProgress: {
          stage: "searching-sources",
          sourceCount: 1,
          evidenceCount: 0,
          previewItems: []
        }
      })
    );
    const continueSession = vi.fn(
      () =>
        new Promise<SessionView>(() => {
          // Keep the debate active while route-level unmounting is exercised.
        })
    );

    function WorkspaceHarness() {
      const [showDebate, setShowDebate] = useState(true);

      return (
        <DebateWorkspaceStateProvider>
          {showDebate ? (
            <>
              <button type="button" onClick={() => setShowDebate(false)}>
                Open providers
              </button>
              <SessionShell
                uiLanguage="en"
                createSession={createSession}
                continueSession={continueSession}
              />
            </>
          ) : (
            <>
              <p>Provider page</p>
              <button type="button" onClick={() => setShowDebate(true)}>
                Back to debate
              </button>
            </>
          )}
        </DebateWorkspaceStateProvider>
      );
    }

    render(<WorkspaceHarness />);

    await user.type(screen.getByLabelText("Decision question"), "Should I move to Hangzhou?");
    await user.click(screen.getByRole("button", { name: "Start debate" }));

    expect(await screen.findByText("Current session")).toBeInTheDocument();
    expect(screen.getByLabelText("Decision question")).toHaveValue("Should I move to Hangzhou?");

    await user.click(screen.getByRole("button", { name: "Open providers" }));

    expect(screen.getByText("Provider page")).toBeInTheDocument();
    expect(screen.queryByText("Current session")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Back to debate" }));

    expect(screen.getByText("Current session")).toBeInTheDocument();
    expect(screen.getByLabelText("Decision question")).toHaveValue("Should I move to Hangzhou?");
    expect(screen.getAllByText("Research in progress").length).toBeGreaterThan(0);
  });

  it("reminds users to choose a history folder after a completed debate is not saved", async () => {
    const user = setupUser();
    const createSession = vi.fn().mockResolvedValueOnce(
      buildSession({
        id: "session-no-folder",
        stage: "research"
      })
    );
    const continueSession = vi.fn().mockResolvedValueOnce(
      buildSession({
        id: "session-no-folder",
        stage: "complete"
      })
    );

    persistSessionHistory.mockResolvedValue({ status: "skipped" as const });

    render(
      <SessionShell
        createSession={createSession}
        continueSession={continueSession}
        uiLanguage="en"
      />
    );

    await user.type(screen.getByLabelText("Decision question"), "Should I move this year?");
    await user.click(screen.getByRole("button", { name: "Start debate" }));

    expect(
      await screen.findByText(
        "Choose a history folder in Settings to save completed debates to history."
      )
    ).toBeInTheDocument();
  });

  it("does not show the history folder reminder after a completed debate is saved", async () => {
    const user = setupUser();
    const createSession = vi.fn().mockResolvedValueOnce(
      buildSession({
        id: "session-with-folder",
        stage: "complete"
      })
    );

    persistSessionHistory.mockResolvedValue({ status: "written" as const });

    render(
      <SessionShell
        createSession={createSession}
        continueSession={vi.fn()}
        uiLanguage="en"
      />
    );

    await user.type(screen.getByLabelText("Decision question"), "Should I move this year?");
    await user.click(screen.getByRole("button", { name: "Start debate" }));

    await waitFor(() => {
      expect(persistSessionHistory).toHaveBeenCalledTimes(1);
    });
    expect(
      screen.queryByText(
        "Choose a history folder in Settings to save completed debates to history."
      )
    ).not.toBeInTheDocument();
  });

  it("preserves the question draft when the debate page unmounts inside the workspace", async () => {
    const user = setupUser();

    function WorkspaceHarness() {
      const [showDebate, setShowDebate] = useState(true);

      return (
        <DebateQuestionDraftProvider>
          {showDebate ? (
            <>
              <button type="button" onClick={() => setShowDebate(false)}>
                Open settings
              </button>
              <SessionShell uiLanguage="en" createSession={vi.fn()} continueSession={vi.fn()} />
            </>
          ) : (
            <button type="button" onClick={() => setShowDebate(true)}>
              Back to debate
            </button>
          )}
        </DebateQuestionDraftProvider>
      );
    }

    render(<WorkspaceHarness />);

    await user.type(screen.getByLabelText("Decision question"), "Should I move to Hangzhou?");
    await user.click(screen.getByRole("button", { name: "Open settings" }));
    await user.click(screen.getByRole("button", { name: "Back to debate" }));

    expect(screen.getByLabelText("Decision question")).toHaveValue("Should I move to Hangzhou?");
  });
});
