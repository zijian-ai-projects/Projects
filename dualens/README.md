# 两仪决 Dualens

一个面向复杂判断的双视角证据辩论工作台。

两仪决不是普通问答工具。它围绕“一个问题，两种视角，证据始终可见”的结构，把研究、立论、驳论、证据对照和最终判断放在同一个工作流里，帮助用户在复杂问题中形成更稳健的下一步。

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![React](https://img.shields.io/badge/React-19-149eca)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38bdf8)
![Vitest](https://img.shields.io/badge/Tested_with-Vitest-729b1b)

## 产品定位

复杂决策通常不是缺一个答案，而是缺一个能同时看见支持、反对、证据和不确定性的判断空间。

Dualens 使用两个视角展开结构化推演：

- `乾明 / Lumina`：负责建立主张、提出支持理由
- `坤察 / Vigila`：负责审视前提、指出风险与反例

系统先围绕问题检索与抽取证据，再让双方基于证据进行辩论，最后收束为结构化决策总结。

## 路由结构

| Route | Purpose |
| --- | --- |
| `/` | 官网首页 / 产品介绍页 |
| `/app` | 产品工作台 / 辩论功能页 |
| `/zh` | 中文官网兼容入口 |
| `/en` | 英文官网兼容入口 |
| `/product` | 兼容旧入口，重定向到 `/` |

## 核心能力

- 双视角决策框架：同一问题被放到支持与审视两侧
- 立论 / 驳论：先建立主张，再主动反证与校准
- 证据可见：来源、摘要、数据点与发言引用保持可追踪
- 双角色卡片：乾明与坤察以对照结构呈现
- 模型与检索配置：支持 OpenAI-compatible 模型和多种搜索服务配置
- 历史保存：可把完成的辩论记录保存到本地目录
- 中英文界面：语言偏好持久化保存
- Light / Dark / System：主题偏好持久化，System 跟随系统外观
- GitHub Star 按钮：通过服务端代理获取 star 数，带短时缓存和失败降级

## 视觉系统

Dualens 的视觉基底来自现代东方审美：

- 太极 logo
- 黑白主色
- 留白和低对比边框
- 圆角大面板
- 双栏 / 对照 / 阴阳节奏
- 动态水墨山水背景

首页使用更完整的水墨山水氛围，`/app` 工作台使用更淡、更低对比的背景，避免干扰输入和阅读。

## 技术栈

- Next.js 15 App Router
- React 19
- TypeScript
- Tailwind CSS
- Vitest
- Playwright
- Zod

## 本地开发

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

在项目根目录创建 `.env.local`：

```bash
DEEPSEEK_API_KEY=your_deepseek_api_key
TAVILY_API_KEY=your_tavily_api_key
```

可选模型配置：

```bash
DEEPSEEK_BASE_URL=https://api.deepseek.com
```

GitHub Star 按钮配置：

```bash
NEXT_PUBLIC_GITHUB_OWNER=zijian-ai-projects
NEXT_PUBLIC_GITHUB_REPO=Dualens
NEXT_PUBLIC_GITHUB_REPO_URL=https://github.com/zijian-ai-projects/Dualens
```

说明：

- `DEEPSEEK_API_KEY` 用于模型调用
- `TAVILY_API_KEY` 推荐配置，用于更稳定的检索
- 如果没有 `TAVILY_API_KEY`，系统会回退到 DuckDuckGo HTML 搜索
- 如果 GitHub 仓库变量未配置，Star 按钮仍展示，数字显示 `--`，不会跳转到错误仓库

### 3. 启动开发环境

```bash
pnpm dev
```

默认访问：

```text
http://localhost:3000
```

## 常用命令

```bash
pnpm dev
pnpm build
pnpm start
pnpm test
pnpm test:e2e
```

## 目录结构

```text
src/
  app/
    page.tsx                 官网首页入口
    providers.tsx            全站语言与主题 Provider
    (workspace)/app/         产品工作台路由
    api/github-stars/        GitHub star 服务端代理
    api/session/             辩论会话 API
  components/
    home/                    官网首页区块
    topbar/                  语言、主题、GitHub Star 操作区
    background/              动态水墨山水背景
    layout/                  工作区布局
    question-form.tsx        问题输入与双角色配置
    session-shell.tsx        辩论工作台主逻辑
    debate-timeline.tsx      辩论时间线
    evidence-panel.tsx       证据面板
    summary-panel.tsx        决策总结
  lib/
    app-preferences.tsx      全站语言偏好
    theme.tsx                Light / Dark / System 主题偏好
    github.ts                GitHub 仓库配置与类型保护
    ui-copy.ts               工作台中英文文案
    workspace-copy.ts        工作区中英文文案
  locales/
    zh-CN.ts                 官网中文文案
    en-US.ts                 官网英文文案
  server/
    runtime.ts               会话推进主入口
    orchestrator.ts          阶段编排
    prompts.ts               提示词拼装
    debate/                  辩论与总结生成
    research/                搜索、网页抽取、证据构建
    llm/                     模型接入层
tests/
  e2e/                       Playwright 端到端测试
```

## 一次完整会话

```text
输入决策问题
  ->
选择双角色风格、发言顺序、模型和检索配置
  ->
进入研究阶段，搜索并抽取证据
  ->
乾明 / 坤察展开立论与驳论
  ->
根据争点补充查证
  ->
生成结构化决策总结
```

## 测试与验证

```bash
pnpm test
pnpm build
pnpm test:e2e
```

当前测试覆盖：

- 首页和 `/app` 路由
- 中英文切换与持久化
- Light / Dark / System 主题
- GitHub Star API 成功、缓存与失败降级
- 辩论会话创建、推进、停止和总结
- 历史、模型服务商、搜索引擎与设置页
- Playwright 端到端工作流

## License

Private project unless a license is added.
