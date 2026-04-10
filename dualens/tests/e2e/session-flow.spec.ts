import { test, expect } from "@playwright/test";

test("user can switch the interface language before starting and complete the session in Chinese", async ({
  page
}) => {
  let createSessionBody: Record<string, unknown> | undefined;
  const researchSession = {
    id: "s1",
    stage: "research",
    evidence: [],
    turns: [],
    summary: undefined
  };
  const continuedSession = {
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
  };
  const completeSession = {
    ...continuedSession,
    stage: "complete",
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

  await page.route("**/api/session", async (route) => {
    createSessionBody = route.request().postDataJSON();
    expect(createSessionBody).toMatchObject({
      question: "我应该为了工作搬到另一个城市吗？",
      presetSelection: {
        pairId: "cautious-aggressive",
        luminaTemperament: "aggressive"
      },
      language: "zh-CN",
      model: "deepseek-reasoner"
    });
    expect(createSessionBody).not.toHaveProperty("providerBaseUrl");
    expect(createSessionBody).not.toHaveProperty("providerApiKey");
    expect(createSessionBody).not.toHaveProperty("providerModel");
    expect(createSessionBody).not.toHaveProperty("config");
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify(researchSession)
    });
  });
  await page.route("**/api/session/*/stop", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(completeSession)
    });
  });
  await page.route("**/api/session/*/continue", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(continuedSession)
    });
  });

  await page.goto("/", { waitUntil: "load" });
  const hero = page.getByRole("heading", { name: /Dualens|两仪决/ }).locator("xpath=ancestor::section[1]");
  const heroForm = hero.locator("form");

  await expect(hero.getByRole("heading", { name: "Dualens" })).toBeVisible();
  await expect(hero.getByRole("button", { name: "中文" })).toBeVisible();
  await expect(hero.getByRole("button", { name: "中文" })).toHaveCount(1);
  await expect(heroForm.getByRole("button", { name: "中文" })).toHaveCount(0);
  await expect(heroForm.getByRole("heading", { name: "Dualens" })).toHaveCount(0);
  await expect(heroForm.getByText("One question. Two lenses. Evidence stays visible.")).toHaveCount(0);
  await expect(
    page.getByText("One question. Two lenses. Evidence stays visible.")
  ).toBeVisible();
  await expect(page.getByText("Advanced settings")).toHaveCount(0);
  await expect(page.getByLabel("Base URL")).toHaveCount(0);
  await expect(page.getByLabel("API key")).toHaveCount(0);
  await page.getByRole("button", { name: "中文" }).click();
  await expect(hero.getByRole("heading", { name: "两仪决" })).toBeVisible();
  await expect(hero.getByRole("button", { name: "中文" })).toHaveCount(1);
  await expect(heroForm.getByRole("heading", { name: "两仪决" })).toHaveCount(0);
  await expect(heroForm.getByText("一个问题。两种视角。证据始终可见。")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "开始辩论" })).toBeVisible();
  await expect(page.getByLabel("决策问题")).toBeVisible();
  await expect(page.getByLabel("模型")).toBeVisible();
  await expect(page.getByLabel("模型")).toHaveValue("deepseek-chat");
  await expect(page.locator('option[value="deepseek-chat"]')).toHaveText("deepseek-chat");
  await expect(page.locator('option[value="deepseek-reasoner"]')).toHaveText("deepseek-reasoner");
  await expect(page.getByText("高级设置")).toHaveCount(0);
  await expect(page.getByLabel("基础 URL")).toHaveCount(0);
  await expect(page.getByLabel("API 密钥")).toHaveCount(0);
  await expect(heroForm.getByRole("menu", { name: "选择性格配对" })).toHaveCount(0);
  await expect(heroForm.locator("section").first().getByText("乾明", { exact: true })).toBeVisible();
  await expect(heroForm.locator("section").nth(1).getByText("坤察", { exact: true })).toBeVisible();
  await expect(page.getByText("立论主张", { exact: true })).toBeVisible();
  await expect(page.getByText("驳论审视", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "谨慎" }).click();
  await page.getByRole("button", { name: "谨慎 / 激进" }).click();
  await page.getByRole("button", { name: "后" }).click();
  await page.getByRole("button", { name: "交换个性分配" }).click();
  await expect(page.getByText("乾明：激进")).toBeVisible();
  await expect(page.getByText("坤察：谨慎")).toBeVisible();

  await page.getByLabel("决策问题").fill("我应该为了工作搬到另一个城市吗？");
  await page.getByLabel("模型").selectOption("deepseek-reasoner");
  await page.getByRole("button", { name: "开始辩论" }).click();

  expect(createSessionBody).toMatchObject({
    question: "我应该为了工作搬到另一个城市吗？",
    presetSelection: {
      pairId: "cautious-aggressive",
      luminaTemperament: "aggressive"
    },
    firstSpeaker: "vigila",
    language: "zh-CN",
    model: "deepseek-reasoner"
  });
  expect(createSessionBody).not.toHaveProperty("providerBaseUrl");
  expect(createSessionBody).not.toHaveProperty("providerApiKey");
  expect(createSessionBody).not.toHaveProperty("providerModel");
  expect(createSessionBody).not.toHaveProperty("config");
  expect(createSessionBody).not.toHaveProperty("uiLanguage");

  await expect(page.getByText("开场立场", { exact: true })).toBeVisible();
  await expect(page.getByText("准备开场")).toBeVisible();
  await expect(page.getByText("Housing market outlook")).toBeVisible();
  await expect(page.getByText("Real summary")).toBeVisible();
  await expect(page.getByText("Draft preview")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "停止辩论" })).toBeVisible();
  await page.getByRole("button", { name: "停止辩论" }).click();
  await expect(page.getByRole("heading", { name: "决策总结" })).toBeVisible();
  await expect(
    page.getByText("The debate was manually stopped while the session was in opening stage.")
  ).toBeVisible();
  await expect(
    page.getByText("The underlying question remains unresolved: Should I move to another city for work?")
  ).toBeVisible();
});

test("user can keep the ui in Chinese and submit the simplified session payload", async ({ page }) => {
  let createSessionBody: Record<string, unknown> | undefined;

  await page.route("**/api/session", async (route) => {
    createSessionBody = route.request().postDataJSON();
    expect(createSessionBody).toMatchObject({
      question: "我应该为了工作搬到另一个城市吗？",
      presetSelection: {
        pairId: "cautious-aggressive",
        luminaTemperament: "cautious"
      },
      language: "zh-CN",
      model: "deepseek-chat"
    });
    expect(createSessionBody).not.toHaveProperty("providerBaseUrl");
    expect(createSessionBody).not.toHaveProperty("providerApiKey");
    expect(createSessionBody).not.toHaveProperty("providerModel");
    expect(createSessionBody).not.toHaveProperty("config");
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        id: "s1",
        stage: "research",
        evidence: [],
        turns: [],
        summary: undefined
      })
    });
  });

  await page.goto("/", { waitUntil: "load" });
  await page.getByRole("button", { name: "中文" }).click();
  const hero = page.getByRole("heading", { name: /Dualens|两仪决/ }).locator("xpath=ancestor::section[1]");
  const heroForm = hero.locator("form");

  await expect(hero.getByRole("heading", { name: "两仪决" })).toBeVisible();
  await expect(hero.getByRole("button", { name: "中文" })).toBeVisible();
  await expect(heroForm.getByRole("button", { name: "中文" })).toHaveCount(0);
  await expect(heroForm.getByRole("heading", { name: "两仪决" })).toHaveCount(0);
  await expect(heroForm.getByText("一个问题。两种视角。证据始终可见。")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "开始辩论" })).toBeVisible();
  await expect(page.getByLabel("模型")).toBeVisible();
  await expect(page.getByLabel("模型")).toHaveValue("deepseek-chat");
  await expect(page.getByText("高级设置")).toHaveCount(0);
  await expect(page.getByLabel("基础 URL")).toHaveCount(0);
  await expect(page.getByLabel("API 密钥")).toHaveCount(0);

  await page.getByLabel("决策问题").fill("我应该为了工作搬到另一个城市吗？");
  await page.getByRole("button", { name: "开始辩论" }).click();

  expect(createSessionBody).toMatchObject({
    question: "我应该为了工作搬到另一个城市吗？",
    presetSelection: {
      pairId: "cautious-aggressive",
      luminaTemperament: "cautious"
    },
    firstSpeaker: "lumina",
    language: "zh-CN",
    model: "deepseek-chat"
  });
  expect(createSessionBody).not.toHaveProperty("providerBaseUrl");
  expect(createSessionBody).not.toHaveProperty("providerApiKey");
  expect(createSessionBody).not.toHaveProperty("providerModel");
  expect(createSessionBody).not.toHaveProperty("config");
  expect(createSessionBody).not.toHaveProperty("uiLanguage");
});
