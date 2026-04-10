import "@testing-library/jest-dom/vitest";

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import HomePage from "@/app/page";
import { createSession } from "@/app/session-client";

describe("createSession", () => {
  it("returns a session only when the response has the expected shape", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "s1",
          stage: "research",
          evidence: [],
          turns: [],
          summary: undefined
        }),
        { status: 201, headers: { "Content-Type": "application/json" } }
      )
    );

    const session = await createSession({
      question: "Should I move to another city for work?",
      presetSelection: {
        pairId: "cautious-aggressive",
        luminaTemperament: "cautious"
      },
      language: "en",
      model: "deepseek-chat"
    });

    expect(session.id).toBe("s1");
    expect(session).toMatchObject({
      id: "s1",
      stage: "research",
      evidence: [],
      turns: []
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/session",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: "Should I move to another city for work?",
          presetSelection: {
            pairId: "cautious-aggressive",
            luminaTemperament: "cautious"
          },
          language: "en",
          model: "deepseek-chat"
        })
      })
    );
    fetchMock.mockRestore();
  });

  it("rejects an invalid 2xx session payload", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "s1",
          stage: "research"
        }),
        { status: 201, headers: { "Content-Type": "application/json" } }
      )
    );

    await expect(
      createSession({
        question: "Should I move to another city for work?",
        presetSelection: {
          pairId: "cautious-aggressive",
          luminaTemperament: "cautious"
        },
        language: "en",
        model: "deepseek-chat"
      })
    ).rejects.toThrow("Invalid session response");

    fetchMock.mockRestore();
  });

  it("surfaces the server error message when create-session fails", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "Invalid session input" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      })
    );

    await expect(
      createSession({
        question: "Should I move to another city for work?",
        presetSelection: {
          pairId: "cautious-aggressive",
          luminaTemperament: "cautious"
        },
        language: "en",
        model: "deepseek-chat"
      })
    ).rejects.toThrow("Invalid session input");

    fetchMock.mockRestore();
  });

  it("preserves structured diagnosis details when create-session fails", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          error: "Unable to start debate.",
          diagnosis: {
            stage: "research",
            failingStep: "prepare-session",
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
          headers: { "Content-Type": "application/json" }
        }
      )
    );

    await expect(
      createSession({
        question: "Should I move to another city for work?",
        presetSelection: {
          pairId: "cautious-aggressive",
          luminaTemperament: "cautious"
        },
        language: "en",
        model: "deepseek-chat"
      })
    ).rejects.toMatchObject({
      message: "Unable to start debate.",
      diagnosis: {
        stage: "research",
        failingStep: "prepare-session",
        providerBaseUrl: "https://api.deepseek.com/v1",
        providerModel: "deepseek-chat",
        category: "auth",
        summary: "Authentication failed while contacting the model endpoint.",
        detail: "OpenAI-compatible request failed with status 401",
        suggestedFix: "Check the API key and confirm the endpoint accepts it."
      }
    });

    fetchMock.mockRestore();
  });

  it("drops malformed diagnosis values when create-session fails", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          error: "Unable to start debate.",
          diagnosis: {
            stage: "searching",
            failingStep: "prepare-session",
            providerBaseUrl: "https://api.deepseek.com/v1",
            providerModel: "deepseek-chat",
            category: "offline",
            summary: "Malformed diagnosis",
            suggestedFix: "Ignore"
          }
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      )
    );

    let caughtError: unknown;
    try {
      await createSession({
        question: "Should I move to another city for work?",
        presetSelection: {
          pairId: "cautious-aggressive",
          luminaTemperament: "cautious"
        },
        language: "en",
        model: "deepseek-chat"
      });
    } catch (error) {
      caughtError = error;
    }

    expect(caughtError).toMatchObject({
      message: "Unable to start debate."
    });
    expect(caughtError).not.toHaveProperty("diagnosis");

    fetchMock.mockRestore();
  });

  it("defaults the homepage to Chinese and keeps the taiji to the left of the product name", async () => {
    const user = userEvent.setup();
    const { container } = render(React.createElement(HomePage));

    const brandHeading = screen.getByRole("heading", { level: 1, name: "两仪决" });
    const uiLanguageToggle = screen.getByLabelText("界面语言");
    const taiji = container.querySelector("svg");

    await waitFor(() => {
      expect(document.title).toBe("两仪决");
    });
    expect(taiji).not.toBeNull();
    expect(
      taiji?.compareDocumentPosition(brandHeading) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(
      brandHeading.compareDocumentPosition(uiLanguageToggle) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(screen.getByRole("heading", { level: 1, name: "两仪决" })).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { level: 1, name: "Dualens / 两仪决" })
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText("界面语言")).toBeInTheDocument();
    expect(
      screen.queryByText("Research, debate, and summary stay visible without crowding the form.")
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "English" }));

    await waitFor(() => {
      expect(document.title).toBe("Dualens");
    });
    expect(screen.getByRole("heading", { level: 1, name: "Dualens" })).toBeInTheDocument();
    expect(
      taiji?.compareDocumentPosition(screen.getByRole("heading", { level: 1, name: "Dualens" })) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(
      screen.queryByRole("heading", { level: 1, name: "Dualens / 两仪决" })
    ).not.toBeInTheDocument();
  });
});
