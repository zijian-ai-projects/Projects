# PersonaForge Character Skill Platform Design

Date: 2026-04-23

## Product Decision

Build a new standalone product named **PersonaForge / 众思阁** by copying and reshaping the Dualens
Next.js application structure. Dualens remains the reusable technical foundation; SageTalk becomes the
source of the built-in sage character pack.

PersonaForge is not a renamed Dualens and not just a SageTalk web UI. It is a character skill dialogue
platform where users can talk with built-in and custom public-figure-inspired character skills, create
new character skills, manage routing preferences, and use evidence-backed dossier mode when modern
facts materially affect a decision.

## Product Architecture

The new app should live as a separate project directory named `personaforge` unless the user chooses a
different repository name during implementation planning. It should copy the Dualens framework choices
where useful:

- Next.js App Router, React, TypeScript, Tailwind, Vitest, and Playwright.
- Existing language, theme, model provider, search provider, history, diagnostics, and layout patterns.
- Existing research service and evidence primitives, adapted into a dossier model.

The SageTalk repository stays separate. Its eight implemented sage skills should be migrated into a
runtime-friendly `CharacterSkill` profile format for PersonaForge while preserving export compatibility
with `SKILL.md`.

## Information Architecture

PersonaForge keeps the Dualens-style route pattern: a product introduction page leading into a workspace.

- `/`: product introduction page. It presents PersonaForge / 众思阁, the character skill concept, the
  built-in SageTalk sage pack, custom skill creation, and evidence-backed dossier decisions. The main
  call to action enters `/app`.
- `/app`: dialogue workspace. The first screen is a single free-form input box. The app does not show
  routing mode, facilitator text, or complex controls in the primary flow.
- `/skills`: character skill library. Users view built-in and custom skills, enable or disable skills,
  mark skills as preferred, exclude skills, import skills, create skills, review generated skills, delete
  custom skills, and export custom skills.
- `/history`: history for conversations and skill creation/review records.
- `/settings`: model, search, language, theme, local data, import/export, and creator defaults.

Workspace navigation contains four primary entries: Dialogue, Skills, History, and Settings.

## Dialogue Experience

The dialogue workspace starts with one input. After submission, an invisible router chooses the mode,
participants, evidence behavior, and response depth.

The router uses a hybrid strategy:

1. Rule checks handle obvious cases: named characters, explicit requests for research, explicit requests
   for debate or council, and questions where current facts clearly matter.
2. An LLM router handles ambiguous cases.
3. The router returns the mode, participant list, whether a dossier is needed, response depth, and a
   debug record.

Routing is invisible in the main UI. The mode and routing rationale are saved for history/debugging but
are not shown in the primary conversation.

Supported invisible modes:

- **Single-character counsel**: one best-fit character responds and asks one follow-up.
- **Council review**: two to four complementary characters speak in sequence and preserve disagreement.
- **Character debate**: value dilemmas debate underlying values; practical decisions debate action plans.
- **Evidence dossier decision**: the system gathers current facts, builds a dossier, then characters speak
  under dossier constraints.

Follow-up input remains free-form. The system infers whether the user is following up with one character,
adding facts, requesting more research, asking for another debate round, or changing participants.

Response length is adaptive. Ordinary personal or reflective questions get shorter turns; complex
decisions or explicit requests for depth get fuller rounds.

## Character Selection Rules

The router selects from the currently enabled character skill pool.

- Problem fit is the primary criterion.
- Preferred characters receive routing weight but do not override poor fit.
- Excluded characters are hard-excluded unless the user explicitly names them in the prompt.
- Built-in and custom skills can both participate in routing.
- For living public figures, the system must use analysis-role framing rather than impersonating the
  person in first person.

## CharacterSkill Model

PersonaForge uses a structured `CharacterSkill` profile at runtime and supports import/export with
`SKILL.md`.

Required core fields:

- `id`
- `displayName`
- `shortDescription`
- `tags`
- `triggerScenarios`
- `worldview`
- `coreTensions`
- `mentalModels`
- `decisionHeuristics`
- `antiPatterns`
- `voiceRules`
- `boundaries`
- `sources`
- `exampleDialogues`
- `confidence`

Optional advanced research appendix:

- `timeline`
- `lifeStages` or `situationLenses`
- `externalViews`
- `qualityScore`
- `testCases`
- `sourceLayerDetails`

Runtime routing and generation should rely only on the required core fields. Advanced fields are used
for review, export, quality tracking, and future regression tests.

## Built-In Skill Pack

The first built-in pack is the SageTalk eight-sage pack:

- Confucius
- Mencius
- Laozi
- Zhuangzi
- Mozi
- Han Feizi
- Sunzi
- Wang Yangming

These built-in skills are read-only in PersonaForge. Users can enable, prefer, or exclude them, but cannot
edit or delete them. They may be exported as compatible `SKILL.md` files. Because SageTalk already has
research depth, these built-ins can include advanced appendices.

## Custom Skills

Custom character skills are local-first. The data model should leave room for future sync/accounts, but
MVP does not require login.

Users can:

- Create new public-figure character skills.
- Import existing `SKILL.md` files.
- Review generated profiles before enabling them.
- Edit display fields, tags, enablement, preference, and exclusion state.
- Regenerate or re-review deep model fields instead of manually editing them.
- Delete custom skills.
- Export custom skills as structured profile plus compatible `SKILL.md`.

If an imported Codex `SKILL.md` is not already a character skill, the app should attempt conversion. If it
cannot extract a person, mental model, trigger scenarios, and boundaries, the import should be rejected
with a clear unsupported message.

## Skill Creator

The creator supports public figures, including living public figures.

Creation flow:

1. User enters a person name and optional goal.
2. User may provide links or pasted text.
3. User chooses depth: standard by default, advanced optional.
4. The system researches public sources.
5. Sources are classified by layer:
   - first-party works, interviews, speeches, or direct public statements
   - reliable biographies, reporting, institutional pages, and profiles
   - third-party commentary
6. The system generates a `CharacterSkill` profile.
7. The system generates example dialogues.
8. The user reviews and confirms before the skill is enabled.

Historical or deceased people can use immersive first-person character voice. Living public figures must
use "based on public material" analysis-role framing and should not speak as if they are the real person.

Standard mode generates the required core fields. Advanced mode also generates the research appendix,
quality score, and test cases. Quality scores warn the user but do not block enablement.

If source coverage is thin, the creator may generate a low-confidence skill, but it must clearly mark
source gaps and boundaries.

## Skill Review

Generated and imported custom skills enter a review screen before enablement.

Default review content:

- source summary
- model summary
- risk and boundary summary
- example dialogues

Expandable review content:

- full source list
- full structured model
- advanced appendix
- quality score and test cases

The user must explicitly confirm review before the custom skill enters the active library.

## Evidence Dossier Mode

Evidence dossier mode triggers only when modern facts materially affect judgment, such as investment,
career decisions, product strategy, policy, markets, law, technology changes, or other current-fact-heavy
questions. Personal cultivation, relationships, and emotional or reflective questions should not be forced
into research mode unless the user asks.

Flow:

1. The router decides a dossier is needed.
2. The UI shows a minimal waiting state: "Reviewing the dossier..." / "正在查阅案卷……"
3. The app searches and extracts sources using the configured search provider.
4. The app builds a dossier from sources, summaries, and key data points.
5. Characters respond under dossier constraints.
6. The dossier is collapsed by default but can be opened to inspect sources, summaries, and key data.
7. Follow-up prompts can trigger invisible dossier updates, such as "research X", "this data is wrong",
   or "here is another fact".

Constraints:

- Factual claims about current reality, trends, feasibility, or risk size must cite the dossier.
- When the dossier is insufficient, characters must say so.
- The app does not force a unified final recommendation.
- Different characters preserve their own judgments and disagreements.

This mode reuses Dualens research provider configuration, evidence extraction, diagnostics, and history
patterns, but the UI remains dialogue-first. The dossier supports the conversation instead of becoming
the main screen.

## History

History contains two record types.

Conversation records include:

- user prompts
- character responses
- selected characters
- hidden mode
- hidden routing rationale
- dossier snapshots and updates
- follow-up decisions
- model/search configuration metadata with secrets redacted

Skill creation records include:

- target person
- user-provided materials
- discovered source list
- generation depth
- generated profile version
- review status
- quality score when available
- enablement timestamp

History shows user-facing results by default. Routing rationale and diagnostics are expandable for
debugging and review.

## Settings

Runtime and local data configuration belongs in `/settings`, not the main dialogue screen.

Settings sections:

- Model provider: OpenAI-compatible base URL, API key, and model name.
- Search provider: Tavily, DuckDuckGo fallback, and future engines; API key, endpoint, and depth.
- Language and theme: Chinese/English, light/dark/system.
- Local data: conversation history location, skill library location, import/export, backup.
- Creator defaults: default standard/advanced mode, source depth, example dialogue generation.
- Privacy and boundaries: local-first skill storage, API key handling, public-source requirement for
  living public figures.

The dialogue workspace may show a lightweight configuration status entry that links to Settings, but it
should not expose full configuration controls.

## Visual And Brand Direction

Brand:

- Chinese: 众思阁
- English: PersonaForge
- Candidate domain: `personaforge.top`

SageTalk is the built-in sage pack/source project, not the product name.

Visual direction:

- Neutral knowledge workspace.
- Calm, restrained, clear, and suitable for long sessions.
- Subtle Eastern details are acceptable.
- Do not bind the product to taiji, ink landscape, or traditional decoration.
- The landing page may be more expressive; the workspace should remain utilitarian and focused.

Character imagery:

- Historical and deceased figures may use stylized portraits.
- Living public figures use abstract marks rather than real likenesses.
- MVP generates stylized avatars for the eight built-in sages.
- Custom skills initially use initials, seal-like marks, or geometric abstract identifiers.

Internationalization:

- Chinese and English ship together in MVP.
- Reuse Dualens language switching and preference persistence patterns.
- Chinese copy gets primary craft attention; English remains complete and usable.

## Error Handling And Boundaries

- Missing model configuration should route the user to Settings with a concise explanation.
- Missing search configuration should fall back when possible or show a dossier-specific error.
- Dossier extraction failures should preserve usable snippets where available.
- Skill creation should expose source insufficiency and confidence rather than pretending certainty.
- Living public figure skills must avoid impersonation, private claims, and unsupported psychological
  assertions.
- High-stakes legal, medical, financial, or safety-critical requests may use philosophical or strategic
  framing but should recommend qualified professional support.

## Testing Strategy

Focused MVP tests should cover:

- Route availability for `/`, `/app`, `/skills`, `/history`, and `/settings`.
- Language and theme persistence.
- Settings validation for model and search providers.
- Character skill profile validation for required fields.
- Built-in skill pack loading.
- Preference rules: enabled, preferred, excluded, explicit-name override.
- Hybrid router outputs for representative prompts.
- Dossier mode trigger and non-trigger examples.
- Dossier citation enforcement for current factual claims.
- Custom skill creation review gate.
- `SKILL.md` import conversion success and unsupported failure.
- History persistence for conversations and skill creation records.

Playwright should verify the main product flow: landing page to dialogue, settings configuration status,
skills page management, and history visibility.

## MVP Scope

MVP is "complete but shallow":

- New standalone `personaforge` app from Dualens structure.
- Landing page and four workspace routes.
- Single input dialogue workspace.
- Four invisible modes.
- Built-in eight-sage pack as `CharacterSkill` profiles.
- Skills page with enable/prefer/exclude and custom skill library.
- Standard and advanced skill creator with review gate.
- Dossier mode with collapsible sources.
- Conversation and skill creation history.
- Settings for model, search, language, theme, local data, and creator defaults.

Out of scope for MVP:

- Accounts or cloud sync.
- Public marketplace.
- Real portrait generation for living public figures.
- General non-character tool skill execution.
- Full automated LLM judge for generated skill quality.
- Unified final decision engine that overrides character disagreement.
