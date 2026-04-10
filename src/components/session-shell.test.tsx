import "@testing-library/jest-dom/vitest";

import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SessionShell } from "@/components/session-shell";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

function setupUser() {
  return userEvent.setup({ advanceTimers: vi.advanceTimersByTimeAsync });
}

describe("SessionShell", () => {
  it("keeps the page-level UI language switch in the shell and renders the hero lockup with the taiji to the left", async () => {
    const { container } = render(<SessionShell />);

    const brandHeading = screen.getByRole("heading", { name: "两仪决" });
    const uiLanguageToggle = screen.getByLabelText("界面语言");
    const taiji = container.querySelector("svg");

    expect(taiji).not.toBeNull();
    expect(
      taiji?.compareDocumentPosition(brandHeading) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(
      brandHeading.compareDocumentPosition(uiLanguageToggle) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(screen.getByRole("button", { name: "中文" })).toBeInTheDocument();
    expect(screen.getByLabelText("决策问题")).toBeInTheDocument();
    expect(screen.getAllByText("两仪决", { exact: true })).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: "English" }));

    expect(screen.getByRole("heading", { name: "Dualens" })).toBeInTheDocument();
    expect(
      taiji?.compareDocumentPosition(screen.getByRole("heading", { name: "Dualens" })) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(screen.getByLabelText("Decision question")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start debate" })).toBeInTheDocument();
    expect(screen.getAllByText("Dualens", { exact: true })).toHaveLength(1);
  });

  it("advances research after creation and shows real evidence when available", async () => {
    const user = setupUser();
    const createSession = vi.fn().mockResolvedValue({
      id: "s1",
      stage: "research",
      evidence: [],
      turns: [],
      summary: undefined
    });
    const continueSession = vi
      .fn()
      .mockResolvedValueOnce({
        id: "s1",
        stage: "opening",
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
        turns: [],
        summary: undefined,
        researchProgress: {
          stage: "preparing-opening",
          sourceCount: 3,
          evidenceCount: 1,
          previewItems: [
            {
              title: "Draft preview",
              sourceName: "Example News",
              status: "read"
            }
          ]
        }
      })
      .mockResolvedValueOnce({
        id: "s1",
        stage: "debate",
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
        summary: undefined,
        researchProgress: {
          stage: "preparing-opening",
          sourceCount: 3,
          evidenceCount: 1,
          previewItems: []
        }
      })
      .mockResolvedValueOnce({
        id: "s1",
        stage: "debate",
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
          },
          {
            id: "t2",
            speaker: "Aggressive",
            content: "Upside can justify the move.",
            referencedEvidenceIds: ["e1"]
          },
          {
            id: "t3",
            speaker: "Cautious",
            content: "Cash runway still matters.",
            referencedEvidenceIds: ["e1"]
          }
        ],
        summary: undefined,
        researchProgress: {
          stage: "preparing-opening",
          sourceCount: 3,
          evidenceCount: 1,
          previewItems: []
        }
      })
      .mockResolvedValueOnce({
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
          },
          {
            id: "t2",
            speaker: "Aggressive",
            content: "Upside can justify the move.",
            referencedEvidenceIds: ["e1"]
          },
          {
            id: "t3",
            speaker: "Cautious",
            content: "Cash runway still matters.",
            referencedEvidenceIds: ["e1"]
          },
          {
            id: "t4",
            speaker: "Aggressive",
            content: "Opportunity cost matters too.",
            referencedEvidenceIds: ["e1"]
          },
          {
            id: "t5",
            speaker: "Cautious",
            content: "Risk remains elevated.",
            referencedEvidenceIds: ["e1"]
          },
          {
            id: "t6",
            speaker: "Aggressive",
            content: "The move still looks worthwhile.",
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
      });

    render(<SessionShell createSession={createSession} continueSession={continueSession} />);

    await user.type(screen.getByLabelText("Decision question"), "Should I move?");
    await user.click(screen.getByRole("button", { name: "Start debate" }));

    expect(continueSession).toHaveBeenCalledTimes(4);
    expect(continueSession).toHaveBeenNthCalledWith(1, "s1");
    expect(continueSession).toHaveBeenNthCalledWith(2, "s1");
    expect(continueSession).toHaveBeenNthCalledWith(3, "s1");
    expect(continueSession).toHaveBeenNthCalledWith(4, "s1");
    expect(await screen.findByText("Summary ready")).toBeInTheDocument();
    expect(screen.getByText("Protect downside first.")).toBeInTheDocument();
    expect(screen.getByText("Housing market outlook")).toBeInTheDocument();
    expect(screen.getByText("Real summary")).toBeInTheDocument();
    expect(screen.getByText("Collect more local salary data.")).toBeInTheDocument();
  });

  it("submits the expected payload and reveals the debate workspace", async () => {
    const user = setupUser();
    const createSession = vi.fn().mockResolvedValue({
      id: "s1",
      stage: "research",
      evidence: [],
      turns: [],
      summary: undefined
    });
    const continueSession = vi
      .fn()
      .mockResolvedValueOnce({
        id: "s1",
        stage: "opening",
        evidence: [],
        turns: [],
        summary: undefined,
        researchProgress: {
          stage: "preparing-opening",
          sourceCount: 0,
          evidenceCount: 0,
          previewItems: []
        }
      })
      .mockResolvedValueOnce({
        id: "s1",
        stage: "debate",
        evidence: [],
        turns: [
          {
            id: "t1",
            speaker: "Cautious",
            content: "Protect downside first.",
            referencedEvidenceIds: []
          }
        ],
        summary: undefined,
        researchProgress: {
          stage: "preparing-opening",
          sourceCount: 0,
          evidenceCount: 0,
          previewItems: []
        }
      })
      .mockResolvedValueOnce({
        id: "s1",
        stage: "debate",
        evidence: [],
        turns: [
          {
            id: "t1",
            speaker: "Cautious",
            content: "Protect downside first.",
            referencedEvidenceIds: []
          },
          {
            id: "t2",
            speaker: "Aggressive",
            content: "Upside matters.",
            referencedEvidenceIds: []
          },
          {
            id: "t3",
            speaker: "Cautious",
            content: "Costs still matter.",
            referencedEvidenceIds: []
          }
        ],
        summary: undefined,
        researchProgress: {
          stage: "preparing-opening",
          sourceCount: 0,
          evidenceCount: 0,
          previewItems: []
        }
      })
      .mockResolvedValueOnce({
        id: "s1",
        stage: "complete",
        evidence: [],
        turns: [
          {
            id: "t1",
            speaker: "Cautious",
            content: "Protect downside first.",
            referencedEvidenceIds: []
          }
        ],
        summary: {
          strongestFor: [],
          strongestAgainst: [],
          coreDisagreement: "Risk tolerance.",
          keyUncertainty: "The local market.",
          nextAction: "Collect more evidence."
        },
        researchProgress: {
          stage: "preparing-opening",
          sourceCount: 0,
          evidenceCount: 0,
          previewItems: []
        }
      });

    render(<SessionShell createSession={createSession} continueSession={continueSession} />);

    await user.type(
      screen.getByLabelText("Decision question"),
      "Should I move to another city?"
    );
    await user.click(screen.getByRole("button", { name: "Second" }));
    await user.click(screen.getByRole("button", { name: "Start debate" }));

    expect(createSession).toHaveBeenCalledWith({
      question: "Should I move to another city?",
      presetSelection: {
        pairId: "cautious-aggressive",
        luminaTemperament: "cautious"
      },
      firstSpeaker: "vigila",
      language: "en",
      model: "deepseek-chat"
    });
    expect(continueSession).toHaveBeenCalledTimes(4);
    expect(await screen.findByText("Summary ready")).toBeInTheDocument();
    const workspace = screen.getByRole("region", { name: "Debate workspace" });
    expect(workspace).toBeInTheDocument();
    expect(within(workspace).getByText("Lumina")).toBeInTheDocument();
    expect(within(workspace).getByText("argument lead")).toBeInTheDocument();
    expect(within(workspace).getByText("Vigila")).toBeInTheDocument();
    expect(within(workspace).getByText("critical review")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Stop debate" })).not.toBeInTheDocument();
  });

  it("shows the workspace immediately, then polls in progressive updates", async () => {
    vi.useRealTimers();
    const user = userEvent.setup();
    let resolveFirstPoll: ((value: SessionView) => void) | undefined;
    const createSession = vi.fn().mockResolvedValue({
      id: "s1",
      stage: "research",
      evidence: [],
      turns: [],
      summary: undefined,
      researchProgress: {
        stage: "searching-sources",
        sourceCount: 1,
        evidenceCount: 0,
        previewItems: [
          {
            title: "Housing report",
            sourceName: "Example News",
            status: "found"
          }
        ]
      }
    });
    const continueSession = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise<SessionView>((resolve) => {
            resolveFirstPoll = resolve;
          })
      )
      .mockResolvedValueOnce({
        id: "s1",
        stage: "opening",
        evidence: [
          {
            id: "e1",
            title: "Housing report",
            url: "https://example.com/housing",
            sourceName: "Example News",
            sourceType: "news",
            summary: "Rent increased 8%.",
            dataPoints: ["Rent increased 8%."]
          }
        ],
        turns: [
          {
            id: "t1",
            speaker: "Lumina",
            content: "Protect downside first.",
            referencedEvidenceIds: ["e1"]
          }
        ],
        summary: undefined,
        researchProgress: {
          stage: "preparing-opening",
          sourceCount: 1,
          evidenceCount: 1,
          previewItems: [
            {
              title: "Housing report",
              sourceName: "Example News",
              status: "used"
            }
          ]
        }
      })
      .mockResolvedValueOnce({
        id: "s1",
        stage: "complete",
        evidence: [
          {
            id: "e1",
            title: "Housing report",
            url: "https://example.com/housing",
            sourceName: "Example News",
            sourceType: "news",
            summary: "Rent increased 8%.",
            dataPoints: ["Rent increased 8%."]
          }
        ],
        turns: [
          {
            id: "t1",
            speaker: "Lumina",
            content: "Protect downside first.",
            referencedEvidenceIds: ["e1"]
          },
          {
            id: "t2",
            speaker: "Vigila",
            content: "Upside still matters.",
            referencedEvidenceIds: ["e1"]
          }
        ],
        summary: {
          strongestFor: [{ text: "Upside exists.", evidenceIds: ["e1"] }],
          strongestAgainst: [{ text: "Risk remains.", evidenceIds: ["e1"] }],
          coreDisagreement: "Risk tolerance.",
          keyUncertainty: "Local jobs.",
          nextAction: "Validate local salaries."
        },
        researchProgress: {
          stage: "preparing-opening",
          sourceCount: 1,
          evidenceCount: 1,
          previewItems: [
            {
              title: "Housing report",
              sourceName: "Example News",
              status: "used"
            }
          ]
        }
      });

    render(<SessionShell createSession={createSession} continueSession={continueSession} />);

    await user.type(screen.getByLabelText("Decision question"), "Should I move to another city?");
    await user.click(screen.getByRole("button", { name: "Start debate" }));

    expect(await screen.findByRole("region", { name: "Debate workspace" })).toBeInTheDocument();
    expect(screen.getByText("Research in progress")).toBeInTheDocument();
    expect(screen.getByText("1 source found")).toBeInTheDocument();

    resolveFirstPoll?.({
      id: "s1",
      stage: "opening",
      evidence: [
        {
          id: "e1",
          title: "Housing report",
          url: "https://example.com/housing",
          sourceName: "Example News",
          sourceType: "news",
          summary: "Rent increased 8%.",
          dataPoints: ["Rent increased 8%."]
        }
      ],
      turns: [
        {
          id: "t1",
          speaker: "Lumina",
          content: "Protect downside first.",
          referencedEvidenceIds: ["e1"]
        }
      ],
      summary: undefined,
      researchProgress: {
        stage: "preparing-opening",
        sourceCount: 1,
        evidenceCount: 1,
        previewItems: [
          {
            title: "Housing report",
            sourceName: "Example News",
            status: "used"
          }
        ]
      }
    });

    expect(await screen.findByText("Protect downside first.")).toBeInTheDocument();

    expect(await screen.findByText("Decision summary")).toBeInTheDocument();
    expect(screen.getByText("Validate local salaries.")).toBeInTheDocument();
  });

  it("submits firstSpeaker through the default /api/session request path", async () => {
    const user = setupUser();
    const fetchMock = vi.fn<
      Parameters<typeof fetch>,
      ReturnType<typeof fetch>
    >()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: "s1",
            stage: "research",
            evidence: [],
            turns: [],
            summary: undefined
          }),
          {
            status: 201,
            headers: { "content-type": "application/json" }
          }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: "s1",
            stage: "opening",
            evidence: [],
            turns: [],
            summary: undefined,
            researchProgress: {
              stage: "preparing-opening",
              sourceCount: 0,
              evidenceCount: 0,
              previewItems: []
            }
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" }
          }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: "s1",
            stage: "debate",
            evidence: [],
            turns: [],
            summary: undefined,
            researchProgress: {
              stage: "preparing-opening",
              sourceCount: 0,
              evidenceCount: 0,
              previewItems: []
            }
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" }
          }
        )
      );
    vi.stubGlobal("fetch", fetchMock);

    render(<SessionShell />);

    await user.type(screen.getByLabelText("Decision question"), "Should I move to another city?");
    await user.click(screen.getByRole("button", { name: "Second" }));
    await user.click(screen.getByRole("button", { name: "Start debate" }));

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/api/session",
      expect.objectContaining({
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          question: "Should I move to another city?",
          presetSelection: {
            pairId: "cautious-aggressive",
            luminaTemperament: "cautious"
          },
          firstSpeaker: "vigila",
          language: "en",
          model: "deepseek-chat"
        })
      })
    );
  });

  it("shows the fixed side identities in Chinese when the UI language is Chinese", async () => {
    const user = setupUser();
    const createSession = vi.fn().mockResolvedValue({
      id: "s1",
      stage: "research",
      evidence: [],
      turns: [],
      summary: undefined
    });
    const continueSession = vi
      .fn()
      .mockResolvedValueOnce({
        id: "s1",
        stage: "opening",
        evidence: [],
        turns: [],
        summary: undefined,
        researchProgress: {
          stage: "preparing-opening",
          sourceCount: 0,
          evidenceCount: 0,
          previewItems: []
        }
      })
      .mockResolvedValueOnce({
        id: "s1",
        stage: "debate",
        evidence: [],
        turns: [],
        summary: undefined,
        researchProgress: {
          stage: "preparing-opening",
          sourceCount: 0,
          evidenceCount: 0,
          previewItems: []
        }
      })
      .mockResolvedValueOnce({
        id: "s1",
        stage: "debate",
        evidence: [],
        turns: [
          {
            id: "t1",
            speaker: "乾明",
            content: "第一轮立场",
            referencedEvidenceIds: []
          },
          {
            id: "t2",
            speaker: "坤察",
            content: "第一轮反驳",
            referencedEvidenceIds: []
          },
          {
            id: "t3",
            speaker: "乾明",
            content: "第二轮立场",
            referencedEvidenceIds: []
          }
        ],
        summary: undefined,
        researchProgress: {
          stage: "preparing-opening",
          sourceCount: 0,
          evidenceCount: 0,
          previewItems: []
        }
      })
      .mockResolvedValueOnce({
        id: "s1",
        stage: "complete",
        evidence: [],
        turns: [
          {
            id: "t1",
            speaker: "乾明",
            content: "第一轮立场",
            referencedEvidenceIds: []
          },
          {
            id: "t2",
            speaker: "坤察",
            content: "第一轮反驳",
            referencedEvidenceIds: []
          }
        ],
        summary: {
          strongestFor: [],
          strongestAgainst: [],
          coreDisagreement: "是否值得搬迁。",
          keyUncertainty: "当地岗位前景。",
          nextAction: "补充更多公开资料。"
        },
        researchProgress: {
          stage: "preparing-opening",
          sourceCount: 0,
          evidenceCount: 0,
          previewItems: []
        }
      })
      .mockResolvedValueOnce({
        id: "s1",
        stage: "debate",
        evidence: [],
        turns: [
          {
            id: "t1",
            speaker: "Cautious",
            content: "Opening one",
            referencedEvidenceIds: []
          },
          {
            id: "t2",
            speaker: "Aggressive",
            content: "Opening two",
            referencedEvidenceIds: []
          },
          {
            id: "t3",
            speaker: "Cautious",
            content: "Round two",
            referencedEvidenceIds: []
          }
        ],
        summary: undefined,
        researchProgress: {
          stage: "preparing-opening",
          sourceCount: 0,
          evidenceCount: 0,
          previewItems: []
        }
      })
      .mockResolvedValueOnce({
        id: "s1",
        stage: "complete",
        evidence: [],
        turns: [
          {
            id: "t1",
            speaker: "Cautious",
            content: "Opening one",
            referencedEvidenceIds: []
          }
        ],
        summary: {
          strongestFor: [],
          strongestAgainst: [],
          coreDisagreement: "Risk tolerance.",
          keyUncertainty: "Unknowns remain.",
          nextAction: "Gather more evidence."
        },
        researchProgress: {
          stage: "preparing-opening",
          sourceCount: 0,
          evidenceCount: 0,
          previewItems: []
        }
      });

    render(<SessionShell createSession={createSession} continueSession={continueSession} />);

    await user.click(screen.getByRole("button", { name: "中文" }));
    await user.type(screen.getByLabelText("决策问题"), "我应该为了工作搬到另一个城市吗？");
    await user.click(screen.getByRole("button", { name: "开始辩论" }));

    expect(await screen.findByText("总结已就绪")).toBeInTheDocument();
    const workspace = screen.getByRole("region", { name: "辩论工作区" });
    expect(within(workspace).getAllByText("乾明").length).toBeGreaterThan(0);
    expect(within(workspace).getByText("立论主张")).toBeInTheDocument();
    expect(within(workspace).getAllByText("坤察").length).toBeGreaterThan(0);
    expect(within(workspace).getByText("驳论审视")).toBeInTheDocument();
  });

  it("shows an error when session creation fails", async () => {
    const user = setupUser();
    const createSession = vi.fn().mockRejectedValue(new Error("Network down"));

    render(<SessionShell createSession={createSession} />);

    await user.type(
      screen.getByLabelText("Decision question"),
      "Should I move to another city?"
    );
    await user.click(screen.getByRole("button", { name: "Start debate" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Unable to start debate.");
  });

  it("keeps the form visible when auto-continue fails", async () => {
    const user = setupUser();
    const createSession = vi.fn().mockResolvedValue({
      id: "s1",
      stage: "research",
      evidence: [],
      turns: [],
      summary: undefined
    });
    const continueSession = vi.fn().mockRejectedValue(new Error("Continue failed"));

    render(<SessionShell createSession={createSession} continueSession={continueSession} />);

    await user.type(
      screen.getByLabelText("Decision question"),
      "Should I move to another city?"
    );
    await user.click(screen.getByRole("button", { name: "Start debate" }));

    expect(continueSession).toHaveBeenCalledWith("s1");
    expect(await screen.findByRole("alert")).toHaveTextContent("Unable to advance debate.");
    expect(screen.queryByRole("region", { name: "Debate workspace" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start debate" })).toBeInTheDocument();
  });

  it("clears the previous workspace when a fresh submit attempt fails", async () => {
    const user = setupUser();
    const createSession = vi
      .fn()
      .mockResolvedValueOnce({
        id: "s1",
        stage: "research",
        evidence: [],
        turns: [],
        summary: undefined
      })
      .mockRejectedValueOnce(new Error("Create failed"));
    const continueSession = vi
      .fn()
      .mockResolvedValueOnce({
        id: "s1",
        stage: "opening",
        evidence: [],
        turns: [],
        summary: undefined,
        researchProgress: {
          stage: "preparing-opening",
          sourceCount: 0,
          evidenceCount: 0,
          previewItems: []
        }
      })
      .mockResolvedValueOnce({
        id: "s1",
        stage: "debate",
        evidence: [],
        turns: [],
        summary: undefined,
        researchProgress: {
          stage: "preparing-opening",
          sourceCount: 0,
          evidenceCount: 0,
          previewItems: []
        }
      });

    render(<SessionShell createSession={createSession} continueSession={continueSession} />);

    await user.type(screen.getByLabelText("Decision question"), "Should I move to another city?");
    await user.click(screen.getByRole("button", { name: "Start debate" }));

    expect(await screen.findByRole("region", { name: "Debate workspace" })).toBeInTheDocument();

    await user.clear(screen.getByLabelText("Decision question"));
    await user.type(screen.getByLabelText("Decision question"), "Should I move again?");
    await user.click(screen.getByRole("button", { name: "Start debate" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Unable to start debate.");
    expect(screen.queryByRole("region", { name: "Debate workspace" })).not.toBeInTheDocument();
  });

  it("shows structured diagnosis details when opening generation fails through the fetch helper", async () => {
    const user = setupUser();
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: "s1",
            stage: "research",
            evidence: [],
            turns: [],
            summary: undefined
          }),
          {
            status: 201,
            headers: {
              "Content-Type": "application/json"
            }
          }
        )
      )
      .mockResolvedValue(
        new Response(
          JSON.stringify({
            error: "Generation failed while preparing opening arguments.",
            diagnosis: {
              stage: "opening",
              failingStep: "run-opening-round",
              providerBaseUrl: "https://api.deepseek.com/v1",
              providerModel: "deepseek-chat",
              category: "auth",
              summary: "Authentication failed while contacting the model endpoint.",
              detail: "OpenAI-compatible request failed with status 401",
              suggestedFix: "Check the API key and confirm the endpoint accepts it."
            }
          }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json"
            }
          }
        )
      );

    try {
      render(<SessionShell />);

      await user.type(
        screen.getByLabelText("Decision question"),
        "Should I move to another city?"
      );
      await user.click(screen.getByRole("button", { name: "Start debate" }));

      expect(await screen.findByRole("alert")).toHaveTextContent("Unable to advance debate.");
      expect(
        screen.getByRole("heading", { name: "Opening arguments generation failed." })
      ).toBeInTheDocument();
      expect(screen.getByText("Authentication failed while contacting the model endpoint.")).toBeInTheDocument();
      expect(screen.getByText("run-opening-round")).toBeInTheDocument();
      expect(screen.getByText("https://api.deepseek.com/v1")).toBeInTheDocument();
      expect(screen.getByRole("option", { name: "deepseek-chat" })).toBeInTheDocument();
      expect(screen.getByText("Check the API key and confirm the endpoint accepts it.")).toBeInTheDocument();
    } finally {
      fetchMock.mockRestore();
    }
  });

  it("rejects malformed 2xx session payloads before they can render", async () => {
    const user = setupUser();
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: "s1",
            stage: "research",
            evidence: [],
            turns: [],
            summary: undefined
          }),
          {
            status: 201,
            headers: {
              "Content-Type": "application/json"
            }
          }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: "demo-session",
            stage: "opening",
            evidence: [
              {
                id: "e1",
                title: "Housing market outlook"
              }
            ],
            turns: [],
            summary: undefined,
            researchProgress: {
              stage: "preparing-opening",
              sourceCount: 1,
              evidenceCount: 1,
              previewItems: []
            }
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json"
            }
          }
        )
      );

    try {
      render(<SessionShell />);

      await user.type(screen.getByLabelText("Decision question"), "Should I move to another city?");
      await user.click(screen.getByRole("button", { name: "Start debate" }));

      expect(await screen.findByRole("alert")).toHaveTextContent("Unable to advance debate.");
      expect(screen.queryByRole("region", { name: "Debate workspace" })).not.toBeInTheDocument();
      expect(screen.queryByText("Housing market outlook")).not.toBeInTheDocument();
    } finally {
      fetchMock.mockRestore();
    }
  });

  it("rejects research progress preview items with unexpected statuses", async () => {
    const user = setupUser();
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: "s1",
            stage: "research",
            evidence: [],
            turns: [],
            summary: undefined
          }),
          {
            status: 201,
            headers: {
              "Content-Type": "application/json"
            }
          }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: "s1",
            stage: "opening",
            evidence: [],
            turns: [],
            researchProgress: {
              stage: "preparing-opening",
              sourceCount: 1,
              evidenceCount: 1,
              previewItems: [
                {
                  title: "Draft preview",
                  sourceName: "Example News",
                  status: "archived"
                }
              ]
            }
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json"
            }
          }
        )
      );

    try {
      render(<SessionShell />);

      await user.type(screen.getByLabelText("Decision question"), "Should I move to another city?");
      await user.click(screen.getByRole("button", { name: "Start debate" }));

      expect(await screen.findByRole("alert")).toHaveTextContent("Unable to advance debate.");
      expect(screen.queryByText("Draft preview")).not.toBeInTheDocument();
      expect(screen.queryByRole("region", { name: "Debate workspace" })).not.toBeInTheDocument();
    } finally {
      fetchMock.mockRestore();
    }
  });

  it("ignores malformed diagnosis values from the fetch helper", async () => {
    const user = setupUser();
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: "s1",
            stage: "research",
            evidence: [],
            turns: [],
            summary: undefined
          }),
          {
            status: 201,
            headers: {
              "Content-Type": "application/json"
            }
          }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            error: "Unable to advance debate.",
            diagnosis: {
              stage: "searching",
              failingStep: "run-opening-round",
              providerBaseUrl: "https://api.deepseek.com/v1",
              providerModel: "deepseek-chat",
              category: "offline",
              summary: "Malformed diagnosis",
              suggestedFix: "Ignore"
            }
          }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json"
            }
          }
        )
      );

    try {
      render(<SessionShell />);

      await user.type(screen.getByLabelText("Decision question"), "Should I move to another city?");
      await user.click(screen.getByRole("button", { name: "Start debate" }));

      expect(await screen.findByRole("alert")).toHaveTextContent("Unable to advance debate.");
      expect(screen.queryByRole("heading", { name: /generation failed/i })).not.toBeInTheDocument();
      expect(screen.queryByText("Malformed diagnosis")).not.toBeInTheDocument();
    } finally {
      fetchMock.mockRestore();
    }
  });

  it("stops an active session and renders the final summary", async () => {
    const user = setupUser();
    const createSession = vi.fn().mockResolvedValue({
      id: "s1",
        stage: "opening",
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
        turns: [],
        summary: undefined,
        researchProgress: {
          stage: "preparing-opening",
          sourceCount: 1,
          evidenceCount: 1,
          previewItems: [
            {
              title: "Draft preview",
              sourceName: "Example News",
              status: "read"
            }
          ]
        }
      });
    const stopSession = vi.fn().mockResolvedValue({
      id: "s1",
      stage: "complete",
      evidence: [],
      turns: [],
      summary: {
        strongestFor: [
          {
            text: "Shared evidence already surfaced Housing market outlook.",
            evidenceIds: ["e1"]
          }
        ],
        strongestAgainst: [
          {
            text: "No rebuttals were captured before the debate was manually stopped.",
            evidenceIds: []
          }
        ],
        coreDisagreement: "The debate was manually stopped while the session was in opening stage.",
        keyUncertainty: "The underlying question remains unresolved: Should I move to another city?",
        nextAction: "Resume the debate to refine the strongest arguments and next step."
      }
    });

    render(
      <SessionShell
        createSession={createSession}
        stopSession={stopSession}
      />
    );

    await user.type(
      screen.getByLabelText("Decision question"),
      "Should I move to another city?"
    );
    await user.click(screen.getByRole("button", { name: "Start debate" }));

    await user.click(await screen.findByRole("button", { name: "Stop debate" }));

    expect(stopSession).toHaveBeenCalledWith("s1");
    expect(await screen.findByRole("heading", { name: "Decision summary" })).toBeInTheDocument();
    expect(
      screen.getByText("The debate was manually stopped while the session was in opening stage.")
    ).toBeInTheDocument();
    expect(screen.getByText("The underlying question remains unresolved: Should I move to another city?")).toBeInTheDocument();
  });

  it("switches the workspace chrome to Chinese when the UI language changes", async () => {
    const user = setupUser();
    const createSession = vi.fn().mockResolvedValue({
      id: "s1",
      stage: "research",
      evidence: [],
      turns: [],
      summary: undefined
    });
    const continueSession = vi.fn().mockResolvedValue({
      id: "s1",
      stage: "opening",
      evidence: [],
      turns: [],
      summary: undefined,
      researchProgress: {
        stage: "preparing-opening",
        sourceCount: 2,
        evidenceCount: 1,
        previewItems: [
          {
            title: "Draft preview",
            sourceName: "Example News",
            status: "read"
          }
        ]
      }
    });

    render(<SessionShell createSession={createSession} continueSession={continueSession} />);

    await user.type(screen.getByLabelText("Decision question"), "Should I move?");
    await user.click(screen.getByRole("button", { name: "Start debate" }));

    await screen.findByText("Opening positions");

    await user.click(screen.getByRole("button", { name: "中文" }));

    expect(screen.getByRole("heading", { name: "两仪决" })).toBeInTheDocument();
    expect(screen.queryByText("为棘手决策准备的结构化工作区。")).not.toBeInTheDocument();
    expect(screen.getByRole("region", { name: "辩论工作区" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "研究进度" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "辩论时间线" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "证据预览" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "决策总结" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "停止辩论" })).toBeInTheDocument();
    expect(screen.getByText("研究进度")).toBeInTheDocument();
    expect(screen.getByText("开场立场")).toBeInTheDocument();
    expect(screen.getByText("发现 2 个来源")).toBeInTheDocument();
    expect(screen.getByText("提取 1 条证据")).toBeInTheDocument();
  });

  it("renders async errors in the current ui language after a language switch", async () => {
    const user = setupUser();
    let rejectCreate: ((error: Error) => void) | undefined;
    const createSession = vi.fn().mockImplementation(
      () =>
        new Promise((_, reject) => {
          rejectCreate = reject;
        })
    );

    render(<SessionShell createSession={createSession} />);

    await user.type(screen.getByLabelText("Decision question"), "Should I move?");
    await user.click(screen.getByRole("button", { name: "Start debate" }));

    await user.click(screen.getByRole("button", { name: "中文" }));
    rejectCreate?.(new Error("Network down"));

    expect(await screen.findByRole("alert")).toHaveTextContent("无法开始辩论。 Network down");
  });

  it("keeps the evidence panel accessible name aligned with the shared evidence title in the empty state", async () => {
    const user = setupUser();
    const createSession = vi.fn().mockResolvedValue({
      id: "s1",
      stage: "research",
      evidence: [],
      turns: [],
      summary: undefined
    });
    const continueSession = vi.fn().mockResolvedValue({
      id: "s1",
      stage: "opening",
      evidence: [],
      turns: [],
      summary: undefined,
      researchProgress: {
        stage: "preparing-opening",
        sourceCount: 0,
        evidenceCount: 0,
        previewItems: []
      }
    });

    render(<SessionShell createSession={createSession} continueSession={continueSession} />);

    await user.click(screen.getByRole("button", { name: "中文" }));
    await user.type(screen.getByLabelText("决策问题"), "我应该为了工作搬到另一个城市吗？");
    await user.click(screen.getByRole("button", { name: "开始辩论" }));

    expect(await screen.findByRole("region", { name: "共享证据" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "共享证据" })).toBeInTheDocument();
  });

  it("renders the UI language switch in the hero shell", () => {
    render(<SessionShell />);

    expect(screen.getByLabelText("UI language")).toBeInTheDocument();
  });

  it("stops polling and shows diagnosis details when a polled session snapshot contains a diagnosis", async () => {
    vi.useRealTimers();
    const user = userEvent.setup();
    const createSession = vi.fn().mockResolvedValue({
      id: "s1",
      stage: "debate",
      evidence: [],
      turns: [],
      summary: undefined
    });
    const continueSession = vi
      .fn()
      .mockResolvedValue({
        id: "s1",
        stage: "debate",
        evidence: [],
        turns: [],
        summary: undefined,
        diagnosis: {
          stage: "debate",
          failingStep: "run-debate-round",
          providerBaseUrl: "https://api.deepseek.com",
          providerModel: "deepseek-chat",
          category: "timeout",
          summary: "The model request timed out before completing.",
          detail: "timed out",
          suggestedFix: "Increase the timeout or reduce request load."
        }
      } as never);

    render(<SessionShell createSession={createSession} continueSession={continueSession} />);

    await user.type(screen.getByLabelText("Decision question"), "Should I move to another city?");
    await user.click(screen.getByRole("button", { name: "Start debate" }));

    expect(await screen.findByText("Debate turn generation failed.")).toBeInTheDocument();
    expect(screen.getByText("The model request timed out before completing.")).toBeInTheDocument();
    expect(continueSession).toHaveBeenCalledTimes(1);
  });
});
