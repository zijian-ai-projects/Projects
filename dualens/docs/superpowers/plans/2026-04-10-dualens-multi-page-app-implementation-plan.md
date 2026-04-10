# Dualens Multi-Page App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor Dualens from a single-page debate prototype into a unified multi-page workspace with a fixed sidebar, shared design system, and four first-level routes while preserving the existing debate-session runtime.

**Architecture:** Keep the current Next.js App Router and session APIs intact, then layer a new `(workspace)` route group on top with a shared app shell, reusable product components, and page-specific surfaces for debate, history, AI providers, and general settings. Debate behavior continues to flow through the existing client and server session modules, while history/providers/settings start with typed UI state and clear future persistence seams.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Tailwind CSS, Vitest, Testing Library

---

## File Structure

### Existing files to modify

- `src/app/layout.tsx`
  - Keep global metadata and mount the new global body classes for the neutral product shell.
- `src/app/page.tsx`
  - Redirect the root route to `/debate`.
- `src/app/page.test.ts`
  - Replace the old homepage rendering assertions with root-redirect coverage.
- `src/app/globals.css`
  - Replace the current warm-paper styling with neutral design tokens and shared surface helpers for the workspace.
- `tailwind.config.ts`
  - Update or extend the theme colors to the new neutral system.
- `src/components/ui/button.tsx`
  - Align button variants with the new product styling.
- `src/components/ui/input.tsx`
  - Align inputs with the new surface, border, and focus system.
- `src/components/ui/textarea.tsx`
  - Align textareas with the new surface, border, and focus system.
- `src/components/ui/select.tsx`
  - Align selects with the new surface, border, and focus system.
- `src/components/ui/card.tsx`
  - Align the default card primitive with the new shared surface styling.
- `src/components/session-shell.tsx`
  - Move the existing debate workspace into the new page structure without breaking create/poll/stop behavior.
- `src/components/question-form.tsx`
  - Rework the debate entry block so it fits the new product sections and shared components.

### New files to create

- `src/app/(workspace)/layout.tsx`
  - Shared application shell for all workspace pages.
- `src/app/(workspace)/debate/page.tsx`
  - Debate page entry routed under the new workspace shell.
- `src/app/(workspace)/history/page.tsx`
  - History management page.
- `src/app/(workspace)/providers/page.tsx`
  - AI provider configuration page.
- `src/app/(workspace)/settings/page.tsx`
  - General settings page.
- `src/components/layout/app-shell.tsx`
  - Layout container for sidebar plus main content.
- `src/components/layout/app-sidebar.tsx`
  - Fixed left navigation with brand block and active-state handling.
- `src/components/layout/app-sidebar.test.tsx`
  - Sidebar route and active-state coverage.
- `src/components/common/page-header.tsx`
  - Shared page title and supporting copy block.
- `src/components/common/page-header.test.tsx`
  - Page-header rendering coverage.
- `src/components/common/section-card.tsx`
  - Shared section container for forms and grouped content.
- `src/components/common/section-card.test.tsx`
  - Section-card heading and body coverage.
- `src/components/common/status-tag.tsx`
  - Shared status chip for provider and history states.
- `src/components/common/status-tag.test.tsx`
  - Status-tag tone coverage.
- `src/components/common/provider-list-item.tsx`
  - Provider navigation item for the providers page.
- `src/components/common/setting-row.tsx`
  - Shared row component for settings modules.
- `src/components/common/history-card.tsx`
  - Card component for debate history entries.
- `src/app/(workspace)/debate/page.test.tsx`
  - Debate page layout integration coverage.
- `src/app/(workspace)/providers/page.test.tsx`
  - Providers page coverage.
- `src/app/(workspace)/settings/page.test.tsx`
  - Settings page coverage.
- `src/app/(workspace)/history/page.test.tsx`
  - History page coverage.
- `src/lib/workspace-nav.ts`
  - Shared navigation metadata for the sidebar.

## Task 1: Add the Workspace Routing Foundation

**Files:**
- Create: `src/lib/workspace-nav.ts`
- Create: `src/components/layout/app-shell.tsx`
- Create: `src/components/layout/app-sidebar.tsx`
- Create: `src/components/layout/app-sidebar.test.tsx`
- Create: `src/app/(workspace)/layout.tsx`
- Create: `src/app/(workspace)/debate/page.tsx`
- Create: `src/app/(workspace)/history/page.tsx`
- Create: `src/app/(workspace)/providers/page.tsx`
- Create: `src/app/(workspace)/settings/page.tsx`
- Modify: `src/app/page.tsx`
- Test: `src/app/page.test.ts`
- Test: `src/components/layout/app-sidebar.test.tsx`

- [ ] **Step 1: Write the failing routing and navigation tests**

```tsx
import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const redirect = vi.fn();
const usePathname = vi.fn(() => "/providers");

vi.mock("next/navigation", () => ({
  redirect,
  usePathname
}));

import HomePage from "@/app/page";
import { AppSidebar } from "@/components/layout/app-sidebar";

describe("workspace routing", () => {
  it("redirects the root route to /debate", () => {
    HomePage();

    expect(redirect).toHaveBeenCalledWith("/debate");
  });

  it("renders the four primary navigation links and marks the active route", () => {
    render(<AppSidebar />);

    expect(screen.getByRole("link", { name: "辩论页" })).toHaveAttribute("href", "/debate");
    expect(screen.getByRole("link", { name: "辩论历史页" })).toHaveAttribute("href", "/history");
    expect(screen.getByRole("link", { name: "AI 服务商" })).toHaveAttribute("href", "/providers");
    expect(screen.getByRole("link", { name: "通用设置" })).toHaveAttribute("href", "/settings");
    expect(screen.getByRole("link", { name: "AI 服务商" })).toHaveAttribute("aria-current", "page");
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:

```bash
pnpm vitest run src/app/page.test.ts src/components/layout/app-sidebar.test.tsx
```

Expected: FAIL because the root route still renders the old page and the sidebar does not exist yet.

- [ ] **Step 3: Implement the minimal workspace shell and redirect**

Create the shared nav model and route group:

```ts
// src/lib/workspace-nav.ts
export const workspaceNavItems = [
  { href: "/debate", label: "辩论页", shortLabel: "Debate" },
  { href: "/history", label: "辩论历史页", shortLabel: "History" },
  { href: "/providers", label: "AI 服务商", shortLabel: "Providers" },
  { href: "/settings", label: "通用设置", shortLabel: "Settings" }
] as const;
```

```tsx
// src/app/page.tsx
import { redirect } from "next/navigation";

export default function HomePage() {
  redirect("/debate");
}
```

```tsx
// src/components/layout/app-shell.tsx
import type { ReactNode } from "react";

export function AppShell({
  sidebar,
  children
}: {
  sidebar: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-app text-app-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px]">
        <aside className="hidden w-[272px] shrink-0 border-r border-app-line bg-app-panel lg:block">
          {sidebar}
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
```

```tsx
// src/app/(workspace)/layout.tsx
import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { AppSidebar } from "@/components/layout/app-sidebar";

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  return <AppShell sidebar={<AppSidebar />}>{children}</AppShell>;
}
```

Create temporary page stubs with distinct `<h1>` headings for the four routes so the shell is visible immediately.

- [ ] **Step 4: Run the tests to verify they pass**

Run:

```bash
pnpm vitest run src/app/page.test.ts src/components/layout/app-sidebar.test.tsx
```

Expected: PASS with root redirect and sidebar navigation covered.

## Task 2: Establish Neutral Design Tokens and Shared Product Components

**Files:**
- Modify: `tailwind.config.ts`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`
- Modify: `src/components/ui/button.tsx`
- Modify: `src/components/ui/input.tsx`
- Modify: `src/components/ui/textarea.tsx`
- Modify: `src/components/ui/select.tsx`
- Modify: `src/components/ui/card.tsx`
- Create: `src/components/common/page-header.tsx`
- Create: `src/components/common/page-header.test.tsx`
- Create: `src/components/common/section-card.tsx`
- Create: `src/components/common/section-card.test.tsx`
- Create: `src/components/common/status-tag.tsx`
- Create: `src/components/common/status-tag.test.tsx`

- [ ] **Step 1: Write the failing shared-component tests**

```tsx
import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PageHeader } from "@/components/common/page-header";
import { SectionCard } from "@/components/common/section-card";
import { StatusTag } from "@/components/common/status-tag";

describe("shared product components", () => {
  it("renders a page header with title and description", () => {
    render(<PageHeader title="AI 服务商" description="配置各模型提供方的接入参数。" />);

    expect(screen.getByRole("heading", { level: 1, name: "AI 服务商" })).toBeInTheDocument();
    expect(screen.getByText("配置各模型提供方的接入参数。")).toBeInTheDocument();
  });

  it("renders a section card with a titled content region", () => {
    render(
      <SectionCard title="模型与参数" description="设置当前辩论的模型与轮次。">
        <div>body</div>
      </SectionCard>
    );

    expect(screen.getByRole("heading", { level: 2, name: "模型与参数" })).toBeInTheDocument();
    expect(screen.getByText("body")).toBeInTheDocument();
  });

  it("renders status tags with semantic tone metadata", () => {
    render(<StatusTag tone="success">已配置</StatusTag>);

    expect(screen.getByText("已配置")).toHaveAttribute("data-tone", "success");
  });
});
```

- [ ] **Step 2: Run the shared-component tests to verify they fail**

Run:

```bash
pnpm vitest run \
  src/components/common/page-header.test.tsx \
  src/components/common/section-card.test.tsx \
  src/components/common/status-tag.test.tsx
```

Expected: FAIL because the new components do not exist yet.

- [ ] **Step 3: Implement the neutral theme and shared primitives**

Apply the shared product language:

```ts
// tailwind.config.ts
extend: {
  colors: {
    app: "#f3f3f1",
    "app-panel": "#fbfbfa",
    "app-card": "#ffffff",
    "app-foreground": "#161616",
    "app-muted": "#6d6d6a",
    "app-line": "#dbdbd7",
    "app-strong": "#111111"
  }
}
```

```tsx
// src/components/common/page-header.tsx
import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  action
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 border-b border-app-line pb-6 lg:flex-row lg:items-end lg:justify-between">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-[-0.04em] text-app-strong">{title}</h1>
        {description ? <p className="max-w-3xl text-sm leading-6 text-app-muted">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}
```

```tsx
// src/components/common/section-card.tsx
import type { ReactNode } from "react";

export function SectionCard({
  title,
  description,
  children
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-app-line bg-app-card p-6">
      <div className="mb-5 space-y-1">
        <h2 className="text-lg font-semibold text-app-strong">{title}</h2>
        {description ? <p className="text-sm leading-6 text-app-muted">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
```

```tsx
// src/components/common/status-tag.tsx
import type { ReactNode } from "react";

export function StatusTag({
  tone,
  children
}: {
  tone: "neutral" | "success" | "warning" | "danger";
  children: ReactNode;
}) {
  return (
    <span
      data-tone={tone}
      className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.14em]"
    >
      {children}
    </span>
  );
}
```

Also update `globals.css` and the base `ui/*` primitives so borders, focus rings, surfaces, and spacing all match the new neutral product system.

- [ ] **Step 4: Run the shared-component tests to verify they pass**

Run:

```bash
pnpm vitest run \
  src/components/common/page-header.test.tsx \
  src/components/common/section-card.test.tsx \
  src/components/common/status-tag.test.tsx
```

Expected: PASS with the new shared building blocks in place.

## Task 3: Build the Stable Page Scaffolds

**Files:**
- Modify: `src/app/(workspace)/debate/page.tsx`
- Modify: `src/app/(workspace)/history/page.tsx`
- Modify: `src/app/(workspace)/providers/page.tsx`
- Modify: `src/app/(workspace)/settings/page.tsx`
- Create: `src/app/(workspace)/debate/page.test.tsx`
- Create: `src/app/(workspace)/providers/page.test.tsx`
- Create: `src/app/(workspace)/settings/page.test.tsx`
- Create: `src/app/(workspace)/history/page.test.tsx`

- [ ] **Step 1: Write the failing page-scaffold tests**

```tsx
import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import DebatePage from "@/app/(workspace)/debate/page";
import ProvidersPage from "@/app/(workspace)/providers/page";
import SettingsPage from "@/app/(workspace)/settings/page";
import HistoryPage from "@/app/(workspace)/history/page";

describe("workspace pages", () => {
  it("renders the debate page sections", () => {
    render(<DebatePage />);

    expect(screen.getByRole("heading", { level: 1, name: "辩论页" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "问题输入区" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "双角色配置区" })).toBeInTheDocument();
  });

  it("renders the providers page as a configuration center", () => {
    render(<ProvidersPage />);

    expect(screen.getByRole("heading", { level: 1, name: "AI 服务商" })).toBeInTheDocument();
    expect(screen.getByText("DeepSeek")).toBeInTheDocument();
    expect(screen.getByLabelText("API Key")).toBeInTheDocument();
  });

  it("renders the general settings modules", () => {
    render(<SettingsPage />);

    expect(screen.getByRole("heading", { level: 1, name: "通用设置" })).toBeInTheDocument();
    expect(screen.getByText("语言设置")).toBeInTheDocument();
    expect(screen.getByText("历史记录保存策略")).toBeInTheDocument();
  });

  it("renders the history management controls", () => {
    render(<HistoryPage />);

    expect(screen.getByRole("heading", { level: 1, name: "辩论历史页" })).toBeInTheDocument();
    expect(screen.getByLabelText("搜索历史")).toBeInTheDocument();
    expect(screen.getByText("已完成")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the page tests to verify they fail**

Run:

```bash
pnpm vitest run \
  src/app/'(workspace)'/debate/page.test.tsx \
  src/app/'(workspace)'/providers/page.test.tsx \
  src/app/'(workspace)'/settings/page.test.tsx \
  src/app/'(workspace)'/history/page.test.tsx
```

Expected: FAIL because the stubs do not yet render the required structured surfaces.

- [ ] **Step 3: Implement the page-level scaffolds**

Give every page the same page-frame pattern:

```tsx
<div className="space-y-8 px-6 py-8 lg:px-10 lg:py-10">
  <PageHeader title="辩论页" description="围绕同一决策问题组织双 AI 研究、辩论与总结。" />
  <div className="grid gap-6">
    <SectionCard title="问题输入区">{/* ... */}</SectionCard>
    <SectionCard title="双角色配置区">{/* ... */}</SectionCard>
  </div>
</div>
```

Use the same spacing, border, and width logic across all four routes. Providers and settings should already resemble real configuration pages even before persistence is added.

- [ ] **Step 4: Run the page tests to verify they pass**

Run:

```bash
pnpm vitest run \
  src/app/'(workspace)'/debate/page.test.tsx \
  src/app/'(workspace)'/providers/page.test.tsx \
  src/app/'(workspace)'/settings/page.test.tsx \
  src/app/'(workspace)'/history/page.test.tsx
```

Expected: PASS with the page shells in place.

## Task 4: Integrate the Debate Workflow Into the New Product Surface

**Files:**
- Modify: `src/app/(workspace)/debate/page.tsx`
- Modify: `src/components/session-shell.tsx`
- Modify: `src/components/question-form.tsx`
- Test: `src/components/session-shell.test.tsx`
- Test: `src/app/(workspace)/debate/page.test.tsx`

- [ ] **Step 1: Add the failing debate-page integration assertions**

```tsx
import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import DebatePage from "@/app/(workspace)/debate/page";

describe("DebatePage", () => {
  it("renders the structured entry sections and the existing debate workspace", () => {
    render(<DebatePage />);

    expect(screen.getByRole("heading", { level: 1, name: "辩论页" })).toBeInTheDocument();
    expect(screen.getByLabelText("决策问题")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "模型与参数区" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "开始辩论" })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the debate tests to verify they fail**

Run:

```bash
pnpm vitest run src/app/'(workspace)'/debate/page.test.tsx src/components/session-shell.test.tsx
```

Expected: FAIL because the existing session shell is still shaped like the old standalone page.

- [ ] **Step 3: Recompose the debate page around the existing session behavior**

Implement the new page surface without rewriting the session runtime:

```tsx
// src/app/(workspace)/debate/page.tsx
"use client";

import { createSession } from "@/app/session-client";
import { PageHeader } from "@/components/common/page-header";
import { SessionShell } from "@/components/session-shell";

export default function DebatePage() {
  return (
    <div className="space-y-8 px-6 py-8 lg:px-10 lg:py-10">
      <PageHeader
        title="辩论页"
        description="围绕同一问题配置两位 AI 的立场、风格与模型，并启动正式辩论。"
      />
      <SessionShell createSession={createSession} />
    </div>
  );
}
```

Refactor `SessionShell` and `QuestionForm` so the entry area is grouped into:

- question input
- dual-role configuration
- model and parameter
- action

while the lower workspace still shows:

- research progress
- timeline
- evidence
- summary
- diagnosis when present

- [ ] **Step 4: Run the debate tests to verify they pass**

Run:

```bash
pnpm vitest run src/app/'(workspace)'/debate/page.test.tsx src/components/session-shell.test.tsx
```

Expected: PASS with the new debate-page structure while the current workflow remains functional.

## Task 5: Build the Providers and General Settings Centers

**Files:**
- Create: `src/components/common/provider-list-item.tsx`
- Create: `src/components/common/setting-row.tsx`
- Modify: `src/app/(workspace)/providers/page.tsx`
- Modify: `src/app/(workspace)/settings/page.tsx`
- Test: `src/app/(workspace)/providers/page.test.tsx`
- Test: `src/app/(workspace)/settings/page.test.tsx`

- [ ] **Step 1: Add the failing settings-surface tests**

```tsx
import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ProvidersPage from "@/app/(workspace)/providers/page";
import SettingsPage from "@/app/(workspace)/settings/page";

describe("settings surfaces", () => {
  it("renders selectable providers with configuration status", () => {
    render(<ProvidersPage />);

    expect(screen.getByRole("button", { name: /DeepSeek/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("已配置")).toBeInTheDocument();
    expect(screen.getByLabelText("模型 ID")).toBeInTheDocument();
  });

  it("renders grouped general-setting modules", () => {
    render(<SettingsPage />);

    expect(screen.getByText("默认模型")).toBeInTheDocument();
    expect(screen.getByText("默认辩论角色风格")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "清除缓存" })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the providers/settings tests to verify they fail**

Run:

```bash
pnpm vitest run src/app/'(workspace)'/providers/page.test.tsx src/app/'(workspace)'/settings/page.test.tsx
```

Expected: FAIL because the pages still contain only scaffolds.

- [ ] **Step 3: Implement the configuration-center pages**

Use typed local state and shared row components:

```tsx
// provider item shape
type ProviderItem = {
  id: "deepseek" | "openai" | "gemini" | "doubao";
  name: string;
  configured: boolean;
  apiKeyUrl?: string;
};
```

```tsx
// setting row shape
export function SettingRow({
  label,
  hint,
  control
}: {
  label: string;
  hint?: string;
  control: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-t border-app-line py-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="space-y-1">
        <p className="text-sm font-medium text-app-strong">{label}</p>
        {hint ? <p className="text-sm text-app-muted">{hint}</p> : null}
      </div>
      <div className="w-full max-w-md">{control}</div>
    </div>
  );
}
```

Providers should render:

- left provider list with selected state
- right configuration form with API key, model ID, endpoint, and helper copy

Settings should render grouped cards for:

- language
- default model
- default debate role style
- history retention
- data export
- clear cache
- optional theme

- [ ] **Step 4: Run the providers/settings tests to verify they pass**

Run:

```bash
pnpm vitest run src/app/'(workspace)'/providers/page.test.tsx src/app/'(workspace)'/settings/page.test.tsx
```

Expected: PASS with both settings pages reading as real product centers.

## Task 6: Build the History Management Page and Final Consistency Pass

**Files:**
- Create: `src/components/common/history-card.tsx`
- Modify: `src/app/(workspace)/history/page.tsx`
- Test: `src/app/(workspace)/history/page.test.tsx`
- Modify: `src/components/common/status-tag.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Add the failing history-page test**

```tsx
import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HistoryPage from "@/app/(workspace)/history/page";

describe("HistoryPage", () => {
  it("renders searchable history cards with record actions", () => {
    render(<HistoryPage />);

    expect(screen.getByLabelText("搜索历史")).toBeInTheDocument();
    expect(screen.getByText("是否应该在今年转去独立开发？")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "查看详情" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "重新发起同题辩论" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "删除" })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the history test to verify it fails**

Run:

```bash
pnpm vitest run src/app/'(workspace)'/history/page.test.tsx
```

Expected: FAIL because the history page is still a stub.

- [ ] **Step 3: Implement the history cards and final visual tightening**

Use typed mock history data for the first pass:

```ts
type HistoryRecord = {
  id: string;
  question: string;
  createdAt: string;
  model: string;
  roleSummary: string;
  status: "complete" | "running" | "failed";
};
```

Render:

- header
- search field
- small filter controls
- stacked `HistoryCard` entries

Then do the final consistency pass across the app:

- align radius scales
- align page paddings
- align border opacity
- align button sizes
- align tag tones

- [ ] **Step 4: Run the history test to verify it passes**

Run:

```bash
pnpm vitest run src/app/'(workspace)'/history/page.test.tsx
```

Expected: PASS with the history management surface complete.

## Task 7: Final Verification

**Files:**
- Verification only

- [ ] **Step 1: Run the targeted page and component suite**

Run:

```bash
pnpm vitest run \
  src/app/page.test.ts \
  src/components/layout/app-sidebar.test.tsx \
  src/components/common/page-header.test.tsx \
  src/components/common/section-card.test.tsx \
  src/components/common/status-tag.test.tsx \
  src/app/'(workspace)'/debate/page.test.tsx \
  src/app/'(workspace)'/providers/page.test.tsx \
  src/app/'(workspace)'/settings/page.test.tsx \
  src/app/'(workspace)'/history/page.test.tsx \
  src/components/session-shell.test.tsx
```

Expected: PASS with the new shell, page surfaces, and debate integration covered.

- [ ] **Step 2: Run the broader unit suite**

Run:

```bash
pnpm test
```

Expected: PASS without regressing the existing session and server-side tests.

- [ ] **Step 3: Run the production build**

Run:

```bash
pnpm build
```

Expected: PASS with the new routes and shared components compiled cleanly.

- [ ] **Step 4: Inspect the final route map**

Run:

```bash
rg --files src/app/'(workspace)'
```

Expected: output includes:

- `src/app/(workspace)/layout.tsx`
- `src/app/(workspace)/debate/page.tsx`
- `src/app/(workspace)/history/page.tsx`
- `src/app/(workspace)/providers/page.tsx`
- `src/app/(workspace)/settings/page.tsx`
