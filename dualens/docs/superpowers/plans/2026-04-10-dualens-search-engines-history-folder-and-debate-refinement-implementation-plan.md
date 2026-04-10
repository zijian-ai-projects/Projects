# Dualens Search Engines, History Folder, And Debate Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the new search-engine configuration center, simplify the settings page into a single history-folder control, persist debate JSON files to a user-chosen local folder, and tighten the debate entry layout without breaking the current session runtime.

**Architecture:** Keep the current Next.js workspace shell and debate runtime intact, then layer three client-side seams on top: a reusable left-right configuration-page pattern for providers and search engines, a browser-only history-folder/file-writing subsystem backed by File System Access API plus IndexedDB, and a leaner debate form that reads the selected search engine while still submitting the existing built-in model. This pass remains intentionally UI-first: provider and search-engine forms can stay client-side, while history saving becomes the first real local persistence path.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Tailwind CSS, Vitest, Testing Library, browser File System Access API, IndexedDB

---

## File Structure

### Existing files to modify

- `src/lib/workspace-nav.ts`
  - Add `/search-engines` and rename sidebar copy to `辩论 / 辩论历史 / AI 服务商 / 搜索引擎 / 通用设置`.
- `src/components/layout/app-sidebar.tsx`
  - Render the new five-item navigation order with the existing product shell.
- `src/components/layout/app-sidebar.test.tsx`
  - Cover the updated labels, order, and active-state path for `/search-engines`.
- `src/app/(workspace)/history/page.tsx`
  - Rename the page heading to `辩论历史`.
- `src/app/(workspace)/history/page.test.tsx`
  - Assert the new heading copy.
- `src/app/(workspace)/providers/page.tsx`
  - Upgrade the left card list into radio-like selection cards and keep the right panel synchronized.
- `src/app/(workspace)/providers/page.test.tsx`
  - Assert the new selection behavior and right-panel sync.
- `src/app/(workspace)/settings/page.tsx`
  - Replace the multi-module layout with one single-purpose history-folder card.
- `src/app/(workspace)/settings/page.test.tsx`
  - Assert the simplified page and folder-selection states.
- `src/app/(workspace)/debate/page.tsx`
  - Rename the page heading to `辩论` and keep the language toggle intact.
- `src/app/(workspace)/debate/page.test.tsx`
  - Assert the new page title and summary context.
- `src/components/common/provider-list-item.tsx`
  - Convert the existing item into a generic radio-style selection card with a top-right circular control.
- `src/components/question-form.tsx`
  - Remove the standalone model section, compress the role cards, and show model plus search-engine summary in the action area.
- `src/components/question-form.test.tsx`
  - Cover the condensed role layout and the new action summary.
- `src/components/session-shell.tsx`
  - Track session metadata from the submitted form and write history snapshots as the session changes.
- `src/components/session-shell.test.tsx`
  - Mock the history writer and verify create/update/final-save behavior.

### New files to create

- `src/app/(workspace)/search-engines/page.tsx`
  - New first-level configuration page for Bing, 百度, Google, and Tavily.
- `src/app/(workspace)/search-engines/page.test.tsx`
  - Page-level coverage for search-engine selection and panel updates.
- `src/lib/search-engine-options.ts`
  - Shared search-engine ids, labels, icons, and default form metadata for `/search-engines`.
- `src/lib/search-engine-preferences.ts`
  - LocalStorage-backed helpers for the globally selected search engine.
- `src/lib/search-engine-preferences.test.ts`
  - Unit coverage for load/save behavior and fallback defaults.
- `src/lib/history-folder-store.ts`
  - Browser-only IndexedDB + File System Access helpers for choosing and restoring the local history folder.
- `src/lib/history-folder-store.test.ts`
  - Unit coverage for unsupported browsers, restored handles, and permission-state mapping.
- `src/lib/history-file-writer.ts`
  - Stable filename generation, record serialization, and JSON writing for debate snapshots.
- `src/lib/history-file-writer.test.ts`
  - Unit coverage for filename format, one-file-per-session behavior, and safe error results.

## Task 1: Add The Search-Engines Route And Rename Workspace Labels

**Files:**
- Modify: `src/lib/workspace-nav.ts`
- Modify: `src/components/layout/app-sidebar.test.tsx`
- Modify: `src/app/(workspace)/history/page.tsx`
- Modify: `src/app/(workspace)/history/page.test.tsx`
- Create: `src/app/(workspace)/search-engines/page.tsx`
- Create: `src/app/(workspace)/search-engines/page.test.tsx`

- [ ] **Step 1: Write the failing routing and title tests**

```tsx
import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const usePathname = vi.fn(() => "/search-engines");

vi.mock("next/navigation", () => ({
  usePathname
}));

import { AppSidebar } from "@/components/layout/app-sidebar";
import HistoryPage from "@/app/(workspace)/history/page";
import SearchEnginesPage from "@/app/(workspace)/search-engines/page";

describe("workspace navigation copy", () => {
  it("renders the renamed five-item navigation set in order", () => {
    render(<AppSidebar />);

    const labels = screen
      .getAllByRole("link")
      .map((link) => link.getAttribute("aria-label"))
      .filter(Boolean);

    expect(labels).toEqual([
      "辩论",
      "辩论历史",
      "AI 服务商",
      "搜索引擎",
      "通用设置"
    ]);
    expect(screen.getByRole("link", { name: "搜索引擎" })).toHaveAttribute("aria-current", "page");
  });

  it("renders the renamed history and search-engine page titles", () => {
    render(<HistoryPage />);
    render(<SearchEnginesPage />);

    expect(screen.getByRole("heading", { level: 1, name: "辩论历史" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "搜索引擎" })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:

```bash
pnpm vitest run src/components/layout/app-sidebar.test.tsx src/app/(workspace)/history/page.test.tsx src/app/(workspace)/search-engines/page.test.tsx
```

Expected: FAIL because `/search-engines` does not exist yet and the sidebar/history copy still uses the old labels.

- [ ] **Step 3: Implement the new nav metadata and route stub**

```ts
// src/lib/workspace-nav.ts
export type WorkspaceNavItem = {
  href: "/debate" | "/history" | "/providers" | "/search-engines" | "/settings";
  label: string;
  description: string;
};

export const workspaceNavItems: WorkspaceNavItem[] = [
  { href: "/debate", label: "辩论", description: "配置问题与双角色辩论" },
  { href: "/history", label: "辩论历史", description: "查看既往记录与状态" },
  { href: "/providers", label: "AI 服务商", description: "管理大模型接入配置" },
  { href: "/search-engines", label: "搜索引擎", description: "管理检索引擎与默认选择" },
  { href: "/settings", label: "通用设置", description: "设置历史记录保存目录" }
];
```

```tsx
// src/app/(workspace)/search-engines/page.tsx
import { PageHeader } from "@/components/common/page-header";
import { SectionCard } from "@/components/common/section-card";

export default function SearchEnginesPage() {
  return (
    <div className="space-y-8 px-6 py-8 lg:px-10 lg:py-10">
      <PageHeader
        title="搜索引擎"
        description="配置默认检索引擎与各引擎的接入参数，保持辩论前的检索环境清晰统一。"
      />
      <SectionCard title="搜索引擎列表" description="先建立一级页面与页面标题，随后在同一文件里接入左右分栏配置结构。">
        <div className="text-sm text-app-muted">Bing / 百度 / Google / Tavily</div>
      </SectionCard>
    </div>
  );
}
```

```tsx
// src/app/(workspace)/history/page.tsx
<PageHeader
  title="辩论历史"
  description="集中管理既往问题、模型选择、双方角色设定与会话状态，让重新查看和复盘成为标准流程。"
/>
```

- [ ] **Step 4: Run the tests to verify they pass**

Run:

```bash
pnpm vitest run src/components/layout/app-sidebar.test.tsx src/app/(workspace)/history/page.test.tsx src/app/(workspace)/search-engines/page.test.tsx
```

Expected: PASS with the new route, labels, and page headings in place.

- [ ] **Step 5: Commit**

```bash
git add src/lib/workspace-nav.ts src/components/layout/app-sidebar.test.tsx src/app/(workspace)/history/page.tsx src/app/(workspace)/history/page.test.tsx src/app/(workspace)/search-engines/page.tsx src/app/(workspace)/search-engines/page.test.tsx
git commit -m "feat: add search engine route and rename workspace labels"
```

## Task 2: Build The Shared Selection-Card Pattern For Providers And Search Engines

**Files:**
- Modify: `src/components/common/provider-list-item.tsx`
- Modify: `src/app/(workspace)/providers/page.tsx`
- Modify: `src/app/(workspace)/providers/page.test.tsx`
- Modify: `src/app/(workspace)/search-engines/page.tsx`
- Modify: `src/app/(workspace)/search-engines/page.test.tsx`
- Create: `src/lib/search-engine-options.ts`

- [ ] **Step 1: Write the failing selection-behavior tests**

```tsx
import "@testing-library/jest-dom/vitest";

import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ProvidersPage from "@/app/(workspace)/providers/page";
import SearchEnginesPage from "@/app/(workspace)/search-engines/page";

describe("configuration pages", () => {
  it("lets the provider card selection drive the right panel", async () => {
    const user = userEvent.setup();
    render(<ProvidersPage />);

    const openAiCard = screen.getByRole("radio", { name: /OpenAI/ });
    await user.click(openAiCard);

    expect(openAiCard).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("heading", { level: 2, name: "OpenAI" })).toBeInTheDocument();
  });

  it("renders search engines with the same radio-like selection pattern", async () => {
    const user = userEvent.setup();
    render(<SearchEnginesPage />);

    const googleCard = screen.getByRole("radio", { name: /Google/ });
    await user.click(googleCard);

    expect(googleCard).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("heading", { level: 2, name: "Google" })).toBeInTheDocument();
    expect(screen.getAllByTestId("selection-indicator")).toHaveLength(4);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:

```bash
pnpm vitest run src/app/(workspace)/providers/page.test.tsx src/app/(workspace)/search-engines/page.test.tsx
```

Expected: FAIL because the current provider cards still use `aria-pressed`, `/search-engines` is only a stub, and there is no shared radio-style indicator.

- [ ] **Step 3: Add the shared search-engine config data and generic selection card styling**

```ts
// src/lib/search-engine-options.ts
export type SearchEngineId = "bing" | "baidu" | "google" | "tavily";

export const searchEngineItems = [
  {
    id: "bing",
    name: "Bing",
    configured: false,
    icon: "B",
    endpoint: "https://api.bing.microsoft.com",
    helperText: "填写 Bing Search API 的 Key、Custom Config 或其他必需参数。"
  },
  {
    id: "baidu",
    name: "百度",
    configured: false,
    icon: "百",
    endpoint: "https://aip.baidubce.com",
    helperText: "填写百度搜索接入参数，例如 App ID、Secret Key 与检索入口。"
  },
  {
    id: "google",
    name: "Google",
    configured: false,
    icon: "G",
    endpoint: "https://customsearch.googleapis.com",
    helperText: "填写 Google Custom Search API Key 与搜索引擎 CX。"
  },
  {
    id: "tavily",
    name: "Tavily",
    configured: true,
    icon: "T",
    endpoint: "https://api.tavily.com/search",
    helperText: "填写 Tavily API Key 与所需检索参数，作为当前默认搜索引擎。"
  }
] as const;
```

```tsx
// src/components/common/provider-list-item.tsx
export function ProviderListItem({
  name,
  configured,
  active,
  icon,
  onClick
}: {
  name: string;
  configured: boolean;
  active: boolean;
  icon: ReactNode;
  onClick(): void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      aria-label={name}
      onClick={onClick}
      className={[
        "relative flex w-full items-start justify-between rounded-[24px] border px-4 py-4 text-left transition",
        active ? "border-black/14 bg-white shadow-[0_8px_24px_rgba(0,0,0,0.04)]" : "border-black/8 bg-white/70 hover:border-black/12"
      ].join(" ")}
    >
      <span
        data-testid="selection-indicator"
        aria-hidden="true"
        className={[
          "absolute right-4 top-4 flex h-5 w-5 items-center justify-center rounded-full border transition",
          active ? "border-black bg-white" : "border-black/18 bg-white"
        ].join(" ")}
      >
        <span className={["h-2 w-2 rounded-full", active ? "bg-black" : "bg-transparent"].join(" ")} />
      </span>
      <span className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-black/10 bg-white text-sm font-semibold text-black">
          {icon}
        </span>
        <span>
          <span className="block text-sm font-medium text-black">{name}</span>
          <span className="mt-1 block text-xs text-black/45">{configured ? "已接入" : "未配置"}</span>
        </span>
      </span>
      <StatusTag tone={configured ? "success" : "neutral"}>{configured ? "已配置" : "未配置"}</StatusTag>
    </button>
  );
}
```

- [ ] **Step 4: Implement the left-right pages with synchronized selection**

```tsx
// src/app/(workspace)/search-engines/page.tsx
"use client";

import { useState } from "react";
import { PageHeader } from "@/components/common/page-header";
import { ProviderListItem } from "@/components/common/provider-list-item";
import { SectionCard } from "@/components/common/section-card";
import { StatusTag } from "@/components/common/status-tag";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { searchEngineItems, type SearchEngineId } from "@/lib/search-engine-options";

export default function SearchEnginesPage() {
  const [selectedEngineId, setSelectedEngineId] = useState<SearchEngineId>("tavily");
  const selectedEngine =
    searchEngineItems.find((item) => item.id === selectedEngineId) ?? searchEngineItems[0];

  return (
    <div className="space-y-8 px-6 py-8 lg:px-10 lg:py-10">
      <PageHeader title="搜索引擎" description="统一管理默认检索引擎及其接入参数。" />
      <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
        <SectionCard title="搜索引擎列表" description="选择当前默认检索引擎。">
          <div role="radiogroup" aria-label="搜索引擎" className="space-y-3">
            {searchEngineItems.map((engine) => (
              <ProviderListItem
                key={engine.id}
                name={engine.name}
                configured={engine.configured}
                active={engine.id === selectedEngineId}
                icon={engine.icon}
                onClick={() => setSelectedEngineId(engine.id)}
              />
            ))}
          </div>
        </SectionCard>
        <SectionCard title={selectedEngine.name} description={selectedEngine.helperText} action={<StatusTag tone={selectedEngine.configured ? "success" : "neutral"}>{selectedEngine.configured ? "已配置" : "未配置"}</StatusTag>}>
          <div className="grid gap-4">
            <Input aria-label="API Key" placeholder="输入当前搜索引擎的 API Key" />
            <Input aria-label="Engine ID / CX / App ID" placeholder="输入引擎标识" />
            <Input aria-label="API Endpoint" defaultValue={selectedEngine.endpoint} />
            <Input aria-label="其他必要参数" placeholder="输入区域、市场或其他扩展参数" />
            <div className="flex justify-end gap-3">
              <Button type="button" variant="secondary">重置</Button>
              <Button type="button">保存配置</Button>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
```

```tsx
// src/app/(workspace)/providers/page.tsx
<div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
  <SectionCard title="服务商列表" description="选择当前正在查看的模型服务商。">
    <div role="radiogroup" aria-label="AI 服务商" className="space-y-3">
      {providerItems.map((provider) => (
        <ProviderListItem
          key={provider.id}
          name={provider.name}
          configured={provider.configured}
          active={provider.id === selectedProviderId}
          icon={provider.icon}
          onClick={() => setSelectedProviderId(provider.id)}
        />
      ))}
    </div>
  </SectionCard>
  <SectionCard
    title={selectedProvider.name}
    description={selectedProvider.apiKeyHint}
    action={<StatusTag tone={selectedProvider.configured ? "success" : "neutral"}>{selectedProvider.configured ? "已配置" : "未配置"}</StatusTag>}
  >
    <div className="grid gap-4">
      <Input aria-label="API Key" type="password" placeholder="输入或更新当前服务商的 API Key" />
      <Input aria-label="模型 ID" placeholder="例如 deepseek-chat / gpt-4.1 / gemini-2.5-pro" />
      <Input aria-label="API Endpoint" defaultValue={selectedProvider.endpoint} />
      <Input aria-label="其他必要参数" placeholder="输入组织 ID、Project ID 或兼容模式说明" />
      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary">重置</Button>
        <Button type="button">保存配置</Button>
      </div>
    </div>
  </SectionCard>
</div>
```

- [ ] **Step 5: Run the tests to verify they pass**

Run:

```bash
pnpm vitest run src/app/(workspace)/providers/page.test.tsx src/app/(workspace)/search-engines/page.test.tsx
```

Expected: PASS with both pages using the same card-selection behavior and right-panel sync.

- [ ] **Step 6: Commit**

```bash
git add src/components/common/provider-list-item.tsx src/app/(workspace)/providers/page.tsx src/app/(workspace)/providers/page.test.tsx src/app/(workspace)/search-engines/page.tsx src/app/(workspace)/search-engines/page.test.tsx src/lib/search-engine-options.ts
git commit -m "feat: unify provider and search engine selection cards"
```

## Task 3: Persist The Selected Search Engine For Cross-Page Summary Display

**Files:**
- Create: `src/lib/search-engine-preferences.ts`
- Create: `src/lib/search-engine-preferences.test.ts`
- Modify: `src/app/(workspace)/search-engines/page.tsx`

- [ ] **Step 1: Write the failing preference-store tests**

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadSelectedSearchEngineId, saveSelectedSearchEngineId } from "@/lib/search-engine-preferences";

describe("search-engine preferences", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("falls back to tavily when nothing has been saved", () => {
    expect(loadSelectedSearchEngineId()).toBe("tavily");
  });

  it("restores the saved engine id from localStorage", () => {
    saveSelectedSearchEngineId("google");
    expect(loadSelectedSearchEngineId()).toBe("google");
  });

  it("ignores invalid saved values", () => {
    localStorage.setItem("dualens:selectedSearchEngineId", "duckduckgo");
    expect(loadSelectedSearchEngineId()).toBe("tavily");
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:

```bash
pnpm vitest run src/lib/search-engine-preferences.test.ts
```

Expected: FAIL because the preference module does not exist yet.

- [ ] **Step 3: Implement the localStorage-backed helpers**

```ts
// src/lib/search-engine-preferences.ts
import { searchEngineItems, type SearchEngineId } from "@/lib/search-engine-options";

const STORAGE_KEY = "dualens:selectedSearchEngineId";
const DEFAULT_ENGINE_ID: SearchEngineId = "tavily";
const validIds = new Set<SearchEngineId>(searchEngineItems.map((item) => item.id));

export function loadSelectedSearchEngineId(): SearchEngineId {
  if (typeof window === "undefined") {
    return DEFAULT_ENGINE_ID;
  }

  const saved = window.localStorage.getItem(STORAGE_KEY);
  return saved && validIds.has(saved as SearchEngineId)
    ? (saved as SearchEngineId)
    : DEFAULT_ENGINE_ID;
}

export function saveSelectedSearchEngineId(id: SearchEngineId) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, id);
  }
}

export function loadSelectedSearchEngineLabel() {
  const selectedId = loadSelectedSearchEngineId();
  return searchEngineItems.find((item) => item.id === selectedId)?.name ?? "Tavily";
}
```

```tsx
// src/app/(workspace)/search-engines/page.tsx
const [selectedEngineId, setSelectedEngineId] = useState<SearchEngineId>(() => loadSelectedSearchEngineId());

useEffect(() => {
  saveSelectedSearchEngineId(selectedEngineId);
}, [selectedEngineId]);
```

- [ ] **Step 4: Run the tests to verify they pass**

Run:

```bash
pnpm vitest run src/lib/search-engine-preferences.test.ts src/app/(workspace)/search-engines/page.test.tsx
```

Expected: PASS with the selected engine saved and restored locally.

- [ ] **Step 5: Commit**

```bash
git add src/lib/search-engine-preferences.ts src/lib/search-engine-preferences.test.ts src/app/(workspace)/search-engines/page.tsx
git commit -m "feat: persist selected search engine locally"
```

## Task 4: Implement The History-Folder Store And Simplify The Settings Page

**Files:**
- Create: `src/lib/history-folder-store.ts`
- Create: `src/lib/history-folder-store.test.ts`
- Modify: `src/app/(workspace)/settings/page.tsx`
- Modify: `src/app/(workspace)/settings/page.test.tsx`

- [ ] **Step 1: Write the failing folder-store and settings-page tests**

```tsx
import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/history-folder-store", () => ({
  loadHistoryFolderState: vi.fn(async () => ({
    status: "authorized",
    folderName: "Dualens Histories"
  })),
  chooseHistoryFolder: vi.fn()
}));

import SettingsPage from "@/app/(workspace)/settings/page";

describe("SettingsPage", () => {
  it("renders a single history-folder settings card", async () => {
    render(<SettingsPage />);

    expect(screen.getByRole("heading", { level: 1, name: "通用设置" })).toBeInTheDocument();
    expect(screen.getByText("辩论历史保存文件夹")).toBeInTheDocument();
    expect(screen.queryByText("语言设置")).not.toBeInTheDocument();
    expect(await screen.findByText("Dualens Histories")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "重新选择" })).toBeInTheDocument();
  });
});
```

```ts
import { describe, expect, it } from "vitest";
import { mapPermissionState, formatHistoryFolderState } from "@/lib/history-folder-store";

describe("history-folder store helpers", () => {
  it("maps granted permission to the authorized UI state", () => {
    expect(mapPermissionState("granted")).toBe("authorized");
  });

  it("maps missing directory support to the unsupported UI state", () => {
    expect(formatHistoryFolderState({ supported: false })).toEqual({
      status: "unsupported",
      folderName: null
    });
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:

```bash
pnpm vitest run src/lib/history-folder-store.test.ts src/app/(workspace)/settings/page.test.tsx
```

Expected: FAIL because the folder-store module does not exist and the settings page still renders multiple unrelated controls.

- [ ] **Step 3: Implement the browser-side folder store**

```ts
// src/lib/history-folder-store.ts
export type HistoryFolderStatus = "unselected" | "authorized" | "needs-permission" | "unsupported";

export type HistoryFolderState = {
  status: HistoryFolderStatus;
  folderName: string | null;
  handle?: FileSystemDirectoryHandle;
};

const DB_NAME = "dualens-history";
const STORE_NAME = "settings";
const HANDLE_KEY = "history-folder-handle";

export function mapPermissionState(
  state: PermissionState | "prompt" | "unsupported"
): HistoryFolderStatus {
  if (state === "granted") return "authorized";
  if (state === "prompt") return "needs-permission";
  return "unsupported";
}

export function formatHistoryFolderState({
  supported,
  handle,
  permission
}: {
  supported: boolean;
  handle?: FileSystemDirectoryHandle | null;
  permission?: PermissionState | "prompt";
}): HistoryFolderState {
  if (!supported) {
    return { status: "unsupported", folderName: null };
  }

  if (!handle) {
    return { status: "unselected", folderName: null };
  }

  return {
    status: permission === "granted" ? "authorized" : "needs-permission",
    folderName: handle.name,
    handle
  };
}

async function openHistoryDb(): Promise<IDBDatabase> {
  return await new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function readSavedHandleFromIndexedDb() {
  const db = await openHistoryDb();
  return await new Promise<FileSystemDirectoryHandle | null>((resolve, reject) => {
    const request = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(HANDLE_KEY);
    request.onsuccess = () => resolve((request.result as FileSystemDirectoryHandle | undefined) ?? null);
    request.onerror = () => reject(request.error);
  });
}

async function saveHandleToIndexedDb(handle: FileSystemDirectoryHandle) {
  const db = await openHistoryDb();
  await new Promise<void>((resolve, reject) => {
    const request = db.transaction(STORE_NAME, "readwrite").objectStore(STORE_NAME).put(handle, HANDLE_KEY);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function loadHistoryFolderState(): Promise<HistoryFolderState> {
  if (typeof window === "undefined" || typeof window.indexedDB === "undefined" || !("showDirectoryPicker" in window)) {
    return formatHistoryFolderState({ supported: false });
  }

  const handle = await readSavedHandleFromIndexedDb();
  if (!handle) {
    return formatHistoryFolderState({ supported: true, handle: null });
  }

  const permission = await handle.queryPermission({ mode: "readwrite" });
  return formatHistoryFolderState({ supported: true, handle, permission });
}

export async function chooseHistoryFolder(): Promise<HistoryFolderState> {
  const handle = await window.showDirectoryPicker({ mode: "readwrite" });
  const permission = await handle.requestPermission({ mode: "readwrite" });
  await saveHandleToIndexedDb(handle);
  return formatHistoryFolderState({ supported: true, handle, permission });
}
```

- [ ] **Step 4: Replace the settings page with a single folder card**

```tsx
// src/app/(workspace)/settings/page.tsx
"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/common/page-header";
import { SectionCard } from "@/components/common/section-card";
import { StatusTag } from "@/components/common/status-tag";
import { Button } from "@/components/ui/button";
import { chooseHistoryFolder, loadHistoryFolderState, type HistoryFolderState } from "@/lib/history-folder-store";

const EMPTY_STATE: HistoryFolderState = { status: "unselected", folderName: null };

export default function SettingsPage() {
  const [folderState, setFolderState] = useState<HistoryFolderState>(EMPTY_STATE);

  useEffect(() => {
    void loadHistoryFolderState().then(setFolderState);
  }, []);

  return (
    <div className="space-y-8 px-6 py-8 lg:px-10 lg:py-10">
      <PageHeader title="通用设置" description="只保留辩论历史的本地保存目录，让记录保存逻辑清晰、克制、可预期。" />
      <SectionCard title="辩论历史保存文件夹" description="每一次辩论会保存为一个独立 JSON 文件，并统一写入这里。">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)] lg:items-center">
          <div className="space-y-3 text-sm leading-6 text-app-muted">
            <p>保存规则：每条辩论记录对应一个唯一 JSON 文件，文件名包含创建时间与会话 id。</p>
            <p>当前目录：{folderState.folderName ?? "未选择"}</p>
          </div>
          <div className="space-y-4">
            <StatusTag tone={folderState.status === "authorized" ? "success" : "neutral"}>
              {folderState.status === "authorized" ? "已授权" : folderState.status === "needs-permission" ? "需要重新授权" : folderState.status === "unsupported" ? "当前浏览器不支持" : "未选择"}
            </StatusTag>
            <Button
              type="button"
              disabled={folderState.status === "unsupported"}
              onClick={async () => setFolderState(await chooseHistoryFolder())}
            >
              {folderState.folderName ? "重新选择" : "选择文件夹"}
            </Button>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run:

```bash
pnpm vitest run src/lib/history-folder-store.test.ts src/app/(workspace)/settings/page.test.tsx
```

Expected: PASS with the simplified settings page and browser-folder state mapping covered.

- [ ] **Step 6: Commit**

```bash
git add src/lib/history-folder-store.ts src/lib/history-folder-store.test.ts src/app/(workspace)/settings/page.tsx src/app/(workspace)/settings/page.test.tsx
git commit -m "feat: add history folder settings page"
```

## Task 5: Add Stable JSON Snapshot Writing And Session-Shell Auto-Save

**Files:**
- Create: `src/lib/history-file-writer.ts`
- Create: `src/lib/history-file-writer.test.ts`
- Modify: `src/components/session-shell.tsx`
- Modify: `src/components/session-shell.test.tsx`

- [ ] **Step 1: Write the failing writer and integration tests**

```ts
import { describe, expect, it } from "vitest";
import { buildHistoryFileName, serializeHistoryRecord } from "@/lib/history-file-writer";

describe("history-file writer", () => {
  it("builds a stable timestamped filename for one session", () => {
    expect(buildHistoryFileName("session_7f2a1c", "2026-04-10T14:32:05.000Z")).toBe(
      "dualens-20260410-143205-session_7f2a1c.json"
    );
  });

  it("serializes the expected JSON shape", () => {
    const payload = serializeHistoryRecord(
      {
        createdAt: "2026-04-10T14:32:05.000Z",
        question: "Should I quit my job this year?",
        model: "deepseek-chat",
        searchEngine: "Tavily",
        presetSelection: { pairId: "cautious-aggressive", luminaTemperament: "cautious" },
        firstSpeaker: "lumina",
        language: "zh-CN"
      },
      { id: "session_7f2a1c", stage: "complete", evidence: [], turns: [], summary: undefined }
    );

    expect(payload.question).toBe("Should I quit my job this year?");
    expect(payload.searchEngine).toBe("Tavily");
    expect(payload.updatedAt).toBeDefined();
  });
});
```

```tsx
import "@testing-library/jest-dom/vitest";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const persistSessionHistory = vi.fn(async () => ({ status: "written" }));

vi.mock("@/lib/history-file-writer", () => ({
  persistSessionHistory
}));

import { SessionShell } from "@/components/session-shell";

describe("SessionShell history saving", () => {
  it("writes a snapshot after create and after the session reaches completion", async () => {
    const user = userEvent.setup();
    const createSession = vi
      .fn()
      .mockResolvedValueOnce({ id: "session-1", stage: "research", evidence: [], turns: [] });
    const continueSession = vi
      .fn()
      .mockResolvedValueOnce({ id: "session-1", stage: "complete", evidence: [], turns: [], summary: undefined });

    render(<SessionShell createSession={createSession} continueSession={continueSession} uiLanguage="en" />);

    await user.type(screen.getByLabelText("Decision question"), "Should I move to Shanghai this year?");
    await user.click(screen.getByRole("button", { name: "Start debate" }));

    await waitFor(() => {
      expect(persistSessionHistory).toHaveBeenCalledTimes(2);
    });
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:

```bash
pnpm vitest run src/lib/history-file-writer.test.ts src/components/session-shell.test.tsx
```

Expected: FAIL because no writer exists and `SessionShell` does not persist any JSON snapshots yet.

- [ ] **Step 3: Implement the filename builder, serializer, and non-blocking writer**

```ts
// src/lib/history-file-writer.ts
import type { SessionInput, SessionView } from "@/components/session-shell";
import { loadHistoryFolderState } from "@/lib/history-folder-store";

export type HistoryRecordMeta = Pick<
  SessionInput,
  "question" | "presetSelection" | "firstSpeaker" | "language" | "model"
> & {
  createdAt: string;
  searchEngine: string;
};

export function buildHistoryFileName(sessionId: string, createdAt: string) {
  const date = new Date(createdAt);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `dualens-${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}-${sessionId}.json`;
}

export function serializeHistoryRecord(meta: HistoryRecordMeta, session: SessionView) {
  return {
    id: session.id,
    createdAt: meta.createdAt,
    updatedAt: new Date().toISOString(),
    question: meta.question,
    model: meta.model,
    searchEngine: meta.searchEngine,
    presetSelection: meta.presetSelection,
    firstSpeaker: meta.firstSpeaker,
    language: meta.language,
    stage: session.stage,
    evidence: session.evidence,
    researchProgress: session.researchProgress,
    turns: session.turns,
    summary: session.summary,
    diagnosis: session.diagnosis
  };
}

export async function persistSessionHistory(meta: HistoryRecordMeta & { sessionId: string }, session: SessionView) {
  const folderState = await loadHistoryFolderState();
  if (folderState.status !== "authorized" || !folderState.handle) {
    return { status: "skipped" as const };
  }

  try {
    const fileName = buildHistoryFileName(meta.sessionId, meta.createdAt);
    const fileHandle = await folderState.handle.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(serializeHistoryRecord(meta, session), null, 2));
    await writable.close();
    return { status: "written" as const, fileName };
  } catch {
    return { status: "error" as const };
  }
}
```

- [ ] **Step 4: Track submitted session meta in `SessionShell` and write on every session transition**

```tsx
// src/components/session-shell.tsx
import { loadSelectedSearchEngineLabel } from "@/lib/search-engine-preferences";
import { persistSessionHistory } from "@/lib/history-file-writer";

const [historyMeta, setHistoryMeta] = useState<null | (HistoryRecordMeta & { sessionId: string })>(null);

const handleSubmit = useCallback(
  async (input: SessionInput) => {
    const createdAt = new Date().toISOString();
    setSession(null);
    setErrorKind(null);
    setErrorDetail(null);
    try {
      const next = await createSession(input);
      setHistoryMeta({
        sessionId: next.id,
        createdAt,
        question: input.question,
        presetSelection: input.presetSelection,
        firstSpeaker: input.firstSpeaker,
        language: input.language,
        model: input.model,
        searchEngine: loadSelectedSearchEngineLabel()
      });
      setSession(next);
    } catch (error) {
      setErrorDetail(error instanceof Error && error.message.trim().length > 0 ? error.message : null);
      setErrorKind("start");
    }
  },
  [createSession]
);

useEffect(() => {
  if (!session || !historyMeta) {
    return;
  }

  void persistSessionHistory(historyMeta, session);
}, [historyMeta, session]);
```

- [ ] **Step 5: Run the tests to verify they pass**

Run:

```bash
pnpm vitest run src/lib/history-file-writer.test.ts src/components/session-shell.test.tsx
```

Expected: PASS with one-file-per-session naming, correct JSON serialization, and non-blocking save calls from `SessionShell`.

- [ ] **Step 6: Commit**

```bash
git add src/lib/history-file-writer.ts src/lib/history-file-writer.test.ts src/components/session-shell.tsx src/components/session-shell.test.tsx
git commit -m "feat: auto-save debate history snapshots"
```

## Task 6: Refine The Debate Entry Layout And Show Model Plus Search-Engine Context

**Files:**
- Modify: `src/app/(workspace)/debate/page.tsx`
- Modify: `src/app/(workspace)/debate/page.test.tsx`
- Modify: `src/components/question-form.tsx`
- Modify: `src/components/question-form.test.tsx`

- [ ] **Step 1: Write the failing layout tests**

```tsx
import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/search-engine-preferences", () => ({
  loadSelectedSearchEngineLabel: () => "Tavily"
}));

import DebatePage from "@/app/(workspace)/debate/page";
import { QuestionForm } from "@/components/question-form";

describe("debate layout refinement", () => {
  it("renames the page heading to 辩论", () => {
    render(<DebatePage />);
    expect(screen.getByRole("heading", { level: 1, name: "辩论" })).toBeInTheDocument();
  });

  it("removes the standalone model section and shows model plus search-engine summary in the action area", () => {
    render(<QuestionForm onSubmit={vi.fn()} uiLanguage="zh-CN" />);

    expect(screen.queryByText("模型与参数区")).not.toBeInTheDocument();
    expect(screen.getByText("当前模型")).toBeInTheDocument();
    expect(screen.getByText("当前搜索引擎")).toBeInTheDocument();
  });

  it("renders compact style summaries instead of a standalone speaking-order card", () => {
    render(<QuestionForm onSubmit={vi.fn()} uiLanguage="zh-CN" />);

    expect(screen.getByText("风格：谨慎")).toBeInTheDocument();
    expect(screen.getByText("风格：激进")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "发言顺序" })).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:

```bash
pnpm vitest run src/app/(workspace)/debate/page.test.tsx src/components/question-form.test.tsx
```

Expected: FAIL because the debate page still says `辩论页`, `QuestionForm` still renders `模型与参数区`, and the role cards are still taller with dedicated order blocks.

- [ ] **Step 3: Collapse the debate page to the new heading and condensed `QuestionForm`**

```tsx
// src/app/(workspace)/debate/page.tsx
<PageHeader
  title={uiLanguage === "en" ? "Debate" : "辩论"}
  description={
    uiLanguage === "en"
      ? "Frame the question and confirm both roles before launching the structured debate."
      : "定义问题并确认双方风格后，直接启动正式的双智能体辩论。"
  }
  action={
    <div
      aria-label={uiLanguage === "en" ? "UI language" : "界面语言"}
      className="flex items-center rounded-full border border-black/8 bg-white p-1"
    >
      <Button
        type="button"
        variant={uiLanguage === "en" ? "primary" : "ghost"}
        className="rounded-full px-3 py-1 text-xs"
        aria-pressed={uiLanguage === "en"}
        onClick={() => setUiLanguage("en")}
      >
        English
      </Button>
      <Button
        type="button"
        variant={uiLanguage === "zh-CN" ? "primary" : "ghost"}
        className="rounded-full px-3 py-1 text-xs"
        aria-pressed={uiLanguage === "zh-CN"}
        onClick={() => setUiLanguage("zh-CN")}
      >
        中文
      </Button>
    </div>
  }
/>
```

```tsx
// src/components/question-form.tsx
const DEFAULT_MODEL: BuiltInModel = "deepseek-chat";
const selectedSearchEngineLabel = loadSelectedSearchEngineLabel();

// remove the whole "模型与参数区" SectionCard
// keep firstSpeaker logic, but render it as a small inline chip in each role card

<SectionCard title={sectionCopy.rolesTitle} description={sectionCopy.rolesDescription}>
  <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_72px_minmax(0,1fr)] xl:items-center">
    <section className="rounded-[22px] border border-black/8 bg-white px-5 py-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-base font-semibold text-app-strong">{luminaIdentity.name}</div>
          <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-app-muted">{luminaIdentity.descriptor}</div>
        </div>
        <button type="button" className="rounded-full border border-black/10 px-3 py-1 text-[11px] text-app-muted" onClick={toggleSpeakingOrder}>
          {getOrderLabel("lumina")}
        </button>
      </div>
      <div className="mt-4 rounded-[16px] border border-black/8 bg-black/[0.02] px-4 py-2.5 text-sm font-medium text-app-strong">
        风格：{selectedLuminaLabel}
      </div>
    </section>
    {/* keep the swap button in the center, but smaller */}
    <section className="rounded-[22px] border border-black bg-black px-5 py-4">
      <div className="mt-4 rounded-[16px] border border-white/10 bg-white/[0.08] px-4 py-2.5 text-sm font-medium text-white">
        风格：{selectedVigilaLabel}
      </div>
    </section>
  </div>
</SectionCard>

<SectionCard title={sectionCopy.actionTitle} description={sectionCopy.actionDescription}>
  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
    <Button type="submit" disabled={isSubmitting}>
      {isSubmitting ? uiCopy.startingDebate : uiCopy.startDebate}
    </Button>
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-[18px] border border-black/8 bg-black/[0.03] px-4 py-3">
        <p className="text-[11px] uppercase tracking-[0.16em] text-app-muted">当前模型</p>
        <p className="mt-1 text-sm font-medium text-app-strong">{DEFAULT_MODEL}</p>
      </div>
      <div className="rounded-[18px] border border-black/8 bg-black/[0.03] px-4 py-3">
        <p className="text-[11px] uppercase tracking-[0.16em] text-app-muted">当前搜索引擎</p>
        <p className="mt-1 text-sm font-medium text-app-strong">{selectedSearchEngineLabel}</p>
      </div>
    </div>
  </div>
</SectionCard>
```

Keep the submitted payload model as `DEFAULT_MODEL` so the runtime still uses the supported built-in path.

- [ ] **Step 4: Run the tests to verify they pass**

Run:

```bash
pnpm vitest run src/app/(workspace)/debate/page.test.tsx src/components/question-form.test.tsx
```

Expected: PASS with the standalone model section removed, compact role cards rendered, and the action area showing both model and search-engine context.

- [ ] **Step 5: Commit**

```bash
git add src/app/(workspace)/debate/page.tsx src/app/(workspace)/debate/page.test.tsx src/components/question-form.tsx src/components/question-form.test.tsx
git commit -m "feat: streamline debate entry layout"
```

## Task 7: Run Full Verification And Capture The Final Refactor State

**Files:**
- Modify: none
- Test: `src/components/layout/app-sidebar.test.tsx`
- Test: `src/app/(workspace)/providers/page.test.tsx`
- Test: `src/app/(workspace)/search-engines/page.test.tsx`
- Test: `src/app/(workspace)/settings/page.test.tsx`
- Test: `src/components/session-shell.test.tsx`
- Test: `src/components/question-form.test.tsx`

- [ ] **Step 1: Run the focused regression suite**

Run:

```bash
pnpm vitest run src/components/layout/app-sidebar.test.tsx src/app/(workspace)/history/page.test.tsx src/app/(workspace)/providers/page.test.tsx src/app/(workspace)/search-engines/page.test.tsx src/app/(workspace)/settings/page.test.tsx src/app/(workspace)/debate/page.test.tsx src/components/question-form.test.tsx src/components/session-shell.test.tsx src/lib/search-engine-preferences.test.ts src/lib/history-folder-store.test.ts src/lib/history-file-writer.test.ts
```

Expected: PASS with the new route, settings page, history-saving helpers, and debate layout all covered.

- [ ] **Step 2: Run the full test suite**

Run:

```bash
pnpm test
```

Expected: PASS with no reintroduced failures in the existing session runtime tests.

- [ ] **Step 3: Run the production build**

Run:

```bash
pnpm build
```

Expected: PASS and list `/debate`, `/history`, `/providers`, `/search-engines`, and `/settings` in the route output.

- [ ] **Step 4: Commit the verified implementation**

```bash
git add src
git commit -m "feat: add search engine config and local history persistence"
```
