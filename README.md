# 两仪决 Dualens

一个面向复杂决策场景的双智能体辅助决策系统。

它不是让单个模型直接给出一个“看起来正确”的答案，而是把决策过程拆成研究、辩论、再查证、总结四个阶段，让用户看到观点如何形成、证据来自哪里、分歧集中在哪些地方。

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![React](https://img.shields.io/badge/React-19-149eca)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38bdf8)
![Vitest](https://img.shields.io/badge/Tested_with-Vitest-729b1b)

## TL;DR

- 双智能体围绕同一决策问题进行多轮辩论
- 先研究、再辩论，证据和观点绑定展示
- 后续回合会基于最新 claim 继续补充检索
- 最终输出结构化决策总结，而不是一段泛泛而谈的建议

## Demo

- 线上 Demo：暂未公开部署
- 本地运行：`pnpm install && pnpm dev`
- 默认访问地址：`http://localhost:3000`

## 项目简介

两仪决模拟两个数字员工围绕同一问题进行协作式辩论：

- `乾明 / Lumina`：负责立论主张
- `坤察 / Vigila`：负责驳论审视

系统会先围绕用户问题搜索资料、提取证据，再让两个智能体基于共享证据进行多轮辩论。后续回合还会根据最近一轮的 claim 继续补充检索，最后输出结构化的决策总结。

这个项目的目标不是“替用户做决定”，而是把复杂问题拆解成一个透明、可追踪、可解释的判断过程。

## 核心能力

- 双智能体围绕同一问题进行多轮协作式辩论
- 支持不同性格配对：谨慎 / 激进、理性 / 直觉、成本 / 收益、短期 / 长期
- 先研究、后辩论，避免纯空口生成
- 共享证据池，两个智能体基于同一组资料发言
- 后续回合支持基于最新 claim 的增量检索
- 证据面板支持折叠卡片、来源展示、摘要和数据点查看
- 发言中的证据引用使用可读编号，不直接暴露 UUID
- 最终输出结构化总结：最强支持、最强反对、核心分歧、关键不确定性、下一步行动
- 默认中文界面，同时支持中英文 UI 和会话语言

## 亮点

- 不把 AI 当作单轮问答工具，而是组织成“研究 -> 辩论 -> 再查证 -> 总结”的工作流
- 把证据抽取、回合推进、前端展示和模型输出做成结构化闭环
- 用共享证据池约束双智能体发言，尽量减少纯主观生成
- 用可读证据编号替代原始 UUID，提升辩论和总结的可读性
- 把复杂决策问题拆成“支持 / 反对 / 分歧 / 不确定性 / 下一步”五个清晰维度

## 一次完整会话是怎么运行的

```text
用户输入决策问题
  ->
选择角色配对、发言顺序、模型
  ->
进入研究阶段
  ->
搜索网页并抽取共享证据
  ->
第一位智能体开场立论
  ->
第二位智能体审视与反驳
  ->
基于最近一轮 claim 继续搜索新证据
  ->
追加后续辩论轮次
  ->
生成结构化决策总结
```

## 产品界面

当前界面围绕一个“决策工作台”展开：

- 顶部区域：问题输入、语言切换、角色配置、模型选择
- 中部区域：研究进度、辩论时间线、共享证据面板
- 底部区域：最终决策总结

整个页面强调“过程可见”：

- 用户可以看到研究阶段正在发生什么
- 每条证据都能展开查看完整摘要和数据点
- 每轮辩论都能看到具体引用了哪条证据
- 总结不是一段散文，而是可继续行动的结构化结论

## 适用场景

- 职业选择：要不要换工作、换城市、继续读研
- 产品决策：要不要投入一个新方向、上线一个新功能
- 个人项目判断：要不要继续投入时间、是否值得长期做
- 需要权衡利弊、且短期内很难得到唯一答案的问题

## 技术实现

### 前端

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS

### 后端 / 运行时

- Next.js App Router API Routes
- 会话状态编排 Runtime
- Orchestrator 负责阶段推进
- Session Store 负责保存会话、证据、回合和总结

### 模型与检索

- OpenAI-compatible provider 接入模型调用
- 默认模型：`deepseek-chat`、`deepseek-reasoner`
- 检索提供方：Tavily
- 无 Tavily 时回退到 DuckDuckGo HTML 搜索

### 测试

- Vitest
- Testing Library
- Playwright

## 架构图文字版

```text
[用户]
  ↓
[前端展示层]
  - 问题输入
  - 角色配置
  - 研究进度展示
  - 辩论时间线
  - 证据面板
  - 决策总结
  ↓
[API 路由层]
  - create session
  - get session
  - continue session
  - stop session
  ↓
[Runtime / Orchestrator]
  - 研究阶段
  - 开场阶段
  - 辩论阶段
  - 总结阶段
  ↓
[Research Service]
  - 搜索结果获取
  - 网页抽取
  - 证据摘要
  - 数据点提取
  ↓
[Debate Agent]
  - 乾明：立论主张
  - 坤察：驳论审视
  ↓
[LLM Provider]
  - OpenAI-compatible chat completion
  ↓
[Session Store]
  - 问题
  - 证据
  - 回合
  - 总结
```

## 目录结构

```text
src/
  app/
    api/session/...        API 路由
    page.tsx               首页入口
    session-client.ts      前端请求封装
  components/
    question-form.tsx      问题输入与角色配置
    session-shell.tsx      页面主工作台
    debate-timeline.tsx    辩论时间线
    evidence-panel.tsx     证据面板
    summary-panel.tsx      决策总结
  lib/
    types.ts               领域类型定义
    presets.ts             性格配对与默认配置
    side-identities.ts     双角色文案
    ui-copy.ts             中英文 UI 文案
  server/
    runtime.ts             会话推进主入口
    orchestrator.ts        阶段编排
    prompts.ts             提示词拼装
    debate/                辩论与总结生成
    research/              搜索、网页抽取、证据构建
    llm/                   模型接入层
```

## 本地启动

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

可选配置：

```bash
DEEPSEEK_BASE_URL=https://api.deepseek.com
```

说明：

- `DEEPSEEK_API_KEY` 基本必需，用于模型调用
- `TAVILY_API_KEY` 推荐配置，用于更稳定的检索
- 如果没有 `TAVILY_API_KEY`，系统会回退到 DuckDuckGo 搜索

### 3. 启动开发环境

```bash
pnpm dev
```

打开浏览器访问：

```text
http://localhost:3000
```

## 常用命令

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
pnpm test
pnpm test:e2e
```

## 这个项目解决了什么问题

相较于普通聊天式问答，这个项目更关注决策场景里的三个难点：

- 黑箱问题：用户不知道模型为什么得出这个判断
- 证据问题：观点和资料来源经常脱节
- 分歧问题：很多复杂决策没有唯一正确答案，但单模型往往会输出一个过度确定的结论

两仪决试图用“双智能体 + 共享证据 + 多阶段编排”的方式，把这些问题拆开处理。

## 当前状态

当前版本已经完成：

- 端到端会话闭环
- 研究到辩论再到总结的完整流程
- 证据卡片、引用编号和总结展示
- 中文默认界面
- 后续回合的基于最新 claim 的检索逻辑

后续还可以继续完善：

- 更强的搜索源与重排策略
- 更细粒度的证据质量评估
- 可视化流程图与架构图
- 线上部署与 Demo 页面
- 会话分享与持久化
- 更丰富的总结模板和导出能力

## 适合展示的项目关键词

如果你要把它放到简历、作品集或项目页，可以用这些关键词概括：

- AI Product Prototyping
- Multi-Agent System
- Decision Support
- Retrieval-Augmented Debate
- Structured LLM Workflow
- Next.js Full-Stack Application

## License

当前仓库未单独声明开源协议。如需开源，建议补充 `MIT` 或 `Apache-2.0` License。
