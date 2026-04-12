import { expect, test } from "@playwright/test";

function createSessionFixture(stage: "research" | "opening" | "complete") {
  const baseSession = {
    id: "s1",
    debateMode: "shared-evidence",
    stage,
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
  };

  if (stage !== "complete") {
    return {
      ...baseSession,
      evidence: stage === "research" ? [] : baseSession.evidence,
      researchProgress: stage === "research" ? undefined : baseSession.researchProgress
    };
  }

  return {
    ...baseSession,
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
      keyUncertainty:
        "The underlying question remains unresolved: Should I move to another city for work?",
      nextAction: "Resume the debate to refine the strongest arguments and next step."
    }
  };
}

test("Chinese product entry opens the app route and completes a debate session", async ({
  page
}) => {
  let createSessionBody: Record<string, unknown> | undefined;

  await page.route("**/api/session", async (route) => {
    createSessionBody = route.request().postDataJSON();
    expect(createSessionBody).toMatchObject({
      question: "我应该为了工作搬到另一个城市吗？",
      debateMode: "shared-evidence",
      presetSelection: {
        pairId: "cautious-aggressive",
        luminaTemperament: "aggressive"
      },
      firstSpeaker: "vigila",
      language: "zh-CN",
      model: "deepseek-chat"
    });
    expect(createSessionBody).not.toHaveProperty("providerConfig");
    expect(createSessionBody).not.toHaveProperty("searchConfig");

    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify(createSessionFixture("research"))
    });
  });
  await page.route("**/api/session/*/stop", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(createSessionFixture("complete"))
    });
  });
  await page.route("**/api/session/*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(createSessionFixture("opening"))
    });
  });

  await page.goto("/zh", { waitUntil: "load" });
  await expect(page.getByRole("heading", { name: "两仪决" })).toBeVisible();
  await page.getByRole("link", { name: "立即开始" }).click();
  await expect(page).toHaveURL(/\/app$/);

  const form = page.locator("form");
  await expect(page.getByRole("heading", { name: "辩论" })).toBeVisible();
  await expect(form.getByLabel("决策问题")).toBeVisible();
  await expect(form.getByRole("link", { name: "当前模型: 未配置" })).toBeVisible();
  await expect(form.getByRole("link", { name: "当前搜索引擎: 未配置" })).toBeVisible();
  await expect(form.getByRole("button", { name: "辩论模式: 共证衡辩" })).toBeVisible();
  const roleGrid = form.getByTestId("role-config-grid");
  await expect(roleGrid.locator("section").first().getByText("乾明", { exact: true })).toBeVisible();
  await expect(roleGrid.locator("section").nth(1).getByText("坤察", { exact: true })).toBeVisible();

  await form.getByRole("button", { name: "交换个性分配" }).click();
  await roleGrid.locator("section").first().getByRole("button", { name: "先" }).click();
  await expect(roleGrid.locator("section").first().getByRole("button", { name: "后" })).toBeVisible();
  await expect(roleGrid.locator("section").nth(1).getByRole("button", { name: "先" })).toBeVisible();

  await form.getByLabel("决策问题").fill("我应该为了工作搬到另一个城市吗？");
  await form.getByRole("button", { name: "开始辩论" }).click();

  expect(createSessionBody).toMatchObject({
    question: "我应该为了工作搬到另一个城市吗？",
    debateMode: "shared-evidence",
    firstSpeaker: "vigila",
    language: "zh-CN",
    model: "deepseek-chat"
  });

  await expect(page.getByText("开场立场", { exact: true })).toBeVisible();
  await expect(page.getByText("Housing market outlook")).toBeVisible();
  await page.getByRole("button", { name: /Housing market outlook/ }).click();
  await expect(page.getByText("Real summary")).toBeVisible();
  await expect(page.getByText("Draft preview")).toHaveCount(0);
  await page.getByRole("button", { name: "停止辩论" }).click();
  await expect(page.getByRole("heading", { name: "决策总结" })).toBeVisible();
  await expect(
    page.getByText("The debate was manually stopped while the session was in opening stage.")
  ).toBeVisible();
});

test("English product entry opens the English app route and submits the default session payload", async ({
  page
}) => {
  let createSessionBody: Record<string, unknown> | undefined;

  await page.route("**/api/session", async (route) => {
    createSessionBody = route.request().postDataJSON();
    expect(createSessionBody).toMatchObject({
      question: "Should I move to another city for work?",
      debateMode: "shared-evidence",
      presetSelection: {
        pairId: "cautious-aggressive",
        luminaTemperament: "cautious"
      },
      firstSpeaker: "lumina",
      language: "en",
      model: "deepseek-chat"
    });

    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify(createSessionFixture("research"))
    });
  });

  await page.goto("/en", { waitUntil: "load" });
  await expect(page.getByRole("heading", { name: "Dualens" })).toBeVisible();
  await page.getByRole("link", { name: "Start now" }).click();
  await expect(page).toHaveURL(/\/app$/);

  const form = page.locator("form");
  await expect(page.getByRole("heading", { name: "Debate" })).toBeVisible();
  await expect(form.getByLabel("Decision question")).toBeVisible();
  await expect(form.getByRole("link", { name: "Current model: Not configured" })).toBeVisible();
  await expect(form.getByRole("button", { name: "Debate mode: Shared evidence debate" })).toBeVisible();

  await form.getByLabel("Decision question").fill("Should I move to another city for work?");
  await form.getByRole("button", { name: "Start debate" }).click();

  expect(createSessionBody).toMatchObject({
    question: "Should I move to another city for work?",
    debateMode: "shared-evidence",
    firstSpeaker: "lumina",
    language: "en",
    model: "deepseek-chat"
  });
});
