# Dualens Session History and Provider Links Design

## Requirements

- Keep an active debate visible when the user navigates between top-level workspace pages.
- Keep the state in browser memory only, so a full page refresh still clears the active debate.
- Persist each debate snapshot to the configured local history folder when folder access is authorized.
- If no history folder is configured, show a debate-page reminder after the debate reaches completion.
- Add official API/key links and official tutorial/docs links to every AI provider and search engine configuration panel.

## Approach

- Move debate session state from `SessionShell` into a workspace-level React provider mounted by `AppShell`.
- Store the active `SessionView`, history metadata, question draft, UI errors, stop state, and last history persistence result in that provider.
- Keep `SessionShell` usable in tests without the workspace provider by preserving local fallback state.
- Reuse `persistSessionHistory()` and expose its returned `written`, `skipped`, or `error` status in the debate UI.
- Extend provider and search-engine option metadata with official `apiUrl` and `tutorialUrl` properties, then render external links in each detail panel.

## Official Link Sources

- DeepSeek API docs: `https://api-docs.deepseek.com/`
- OpenAI quickstart and API key dashboard: `https://platform.openai.com/docs/quickstart`, `https://platform.openai.com/api-keys`
- Gemini quickstart and API key setup: `https://ai.google.dev/gemini-api/docs/quickstart`, `https://ai.google.dev/tutorials/setup`
- Volcengine Ark docs and console: `https://www.volcengine.com/docs/82379/2121998`, `https://console.volcengine.com/ark/region:ark+cn-beijing/apiKey`
- Tavily quickstart: `https://docs.tavily.com/guides/quickstart`
- Google Custom Search JSON API introduction: `https://developers.google.cn/custom-search/v1/introduction?hl=en`
- Microsoft Bing Web Search API page and retirement notice: `https://www.microsoft.com/en-us/bing/apis/bing-web-search-api`, `https://learn.microsoft.com/en-us/lifecycle/announcements/bing-search-api-retirement`
- Baidu AppBuilder search docs: `https://ai.baidu.com/ai-doc/AppBuilder/pmaxd1hvy`
