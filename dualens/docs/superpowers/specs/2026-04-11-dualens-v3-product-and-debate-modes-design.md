# Dualens V3 Product and Debate Modes Design

## Goal

Build the next product upgrade for Dualens by adding a product introduction page, extending the existing taiji and ink visual language into the page backgrounds, and introducing a real second debate mode with private evidence pools and pre-speech analysis.

## Scope

This pass includes:

- a new `/product` introduction page;
- changing the existing sidebar taiji mark so clicking the mark opens `/product`;
- subtle global background treatment using taiji, yin-yang, Chinese ink-wash, and restrained Chinese visual language;
- a debate-mode switch on the debate page;
- naming the existing shared-evidence mode;
- adding a second three-round private-evidence mode;
- adding pre-speech analysis before debate turns in both modes;
- saving and showing the expanded debate process in history.

This pass does not include:

- adding a product-page item to the sidebar nav menu;
- changing the size, position, layout, or visual emphasis of existing controls and buttons;
- replacing the current role temperament configuration model;
- adding account systems, cloud persistence, or multi-user sharing;
- building a marketing-style landing page that hides the core app.

## Product Page

Create a `/product` route under the existing workspace shell. The page should match the current product system: restrained, mostly black and white, structured, and quiet. It should feel like an introduction to Dualens, not a separate marketing site.

The content should explain:

- what Dualens does;
- why two agents debate;
- how evidence, analysis, and summary work;
- the two debate modes:
  - `共证衡辩`;
  - `隔证三辩`;
- how to start from the debate page.

The page should incorporate taiji, yin-yang, Chinese-style composition, and ink-wash atmosphere through background and illustration layers. The copy must be user-facing product copy, not self-referential UI descriptions.

The product page may include a normal text/button link back to `/debate`, but it must not add a sidebar nav item.

## Product Entry

The existing taiji mark in the sidebar brand block becomes the only product-page entry requested by the user.

Behavior:

- clicking the taiji mark navigates to `/product`;
- clicking other nav items remains unchanged;
- no new sidebar menu item is added for product introduction;
- the collapsed sidebar keeps the same spatial footprint.

Implementation should preserve the existing sidebar brand layout as much as possible. If needed, split the brand block so the taiji mark is the link target and the wordmark/tagline remain visually unchanged.

## Global Background

Add a shared decorative background layer to the workspace frame. The layer should include subtle yin-yang and ink-wash cues:

- pale ink wash patches;
- a very low-contrast oversized taiji or circular yin-yang balance shape;
- soft rice-paper-like tonal variation.

The background layer must not change existing component layout. Specifically:

- do not change existing button dimensions;
- do not move existing controls;
- do not increase card padding;
- do not alter the grid or flex structure of existing pages;
- do not make controls more prominent;
- keep the background behind content and non-interactive.

The safest approach is an absolutely positioned background layer inside `AppShell`, behind the existing sidebar and main content. It should use `pointer-events: none` and `aria-hidden`.

## Debate Modes

Add a durable debate mode domain model.

Mode names:

- Existing mode: `共证衡辩`
- New mode: `隔证三辩`

Suggested type:

```ts
export type DebateMode = "shared-evidence" | "private-evidence";
```

Add this mode to session creation and session config:

```ts
type SessionConfig = {
  debateMode: DebateMode;
  roundCount: number;
  // existing fields remain
};
```

`shared-evidence` uses the existing shared evidence pool. `private-evidence` uses side-specific evidence pools and a fixed three-round debate.

## Debate Page Mode Switch

Add a mode switch in the debate page action area. It must not rearrange the rest of the page.

Placement:

- inside the existing action section controls;
- near the runtime context controls;
- without changing the question input area or role configuration area.

Behavior:

- default mode is `共证衡辩`;
- switching to `隔证三辩` updates the next session payload;
- mode choice should persist while moving across first-level pages;
- refreshing the page may reset it, matching the current draft/session behavior rules unless existing workspace state already persists it.

The switch can be a compact select or segmented control. Prefer a compact select if it is the least disruptive to the current layout.

## Shared-Evidence Mode: 共证衡辩

This is the current mode, renamed and upgraded.

Behavior:

1. The session keeps one shared evidence pool.
2. Before each turn, the speaking agent performs analysis of the opponent's previous turn when one exists.
3. The analysis checks for:
   - factual problems: incorrect data, examples, or premises;
   - logical problems: broken causality, overgeneralization, concept switching;
   - value problems: biased standards, harmful tradeoffs, or distorted priorities.
4. After analysis, the system searches for additional shared evidence relevant to the claim being checked.
5. The agent then speaks using the shared evidence pool.

The first turn has no opponent turn, so its analysis may be omitted or stored as an opening analysis that says no prior opponent claim exists.

## Private-Evidence Mode: 隔证三辩

This is the new mode.

Core rules:

1. The debate has exactly three rounds.
2. Each agent has its own private evidence pool.
3. Agents cannot see the other agent's private evidence in prompts.
4. Each turn follows:
   - analysis of the opponent's previous turn;
   - private evidence search for the speaking agent;
   - speech using only the speaking agent's private evidence and visible debate turns.
5. The frontend and history can show the complete process to the user after or during the session.

Round sequence:

1. Round 1:
   - Agent A searches private evidence based on the question and gives the first speech.
   - Agent B analyzes Agent A's first speech, searches private evidence, and gives the first speech.
2. Round 2:
   - Agent A analyzes Agent B's previous speech, searches private evidence, and gives the second speech.
   - Agent B analyzes Agent A's previous speech, searches private evidence, and gives the second speech.
3. Round 3:
   - Agent A analyzes Agent B's previous speech, searches private evidence, and gives the third speech.
   - Agent B analyzes Agent A's previous speech, searches private evidence, and gives the third speech.

Agent A is whichever side is configured as first speaker. Agent B is the other side.

## Domain Data

Extend the session data without breaking older history records.

Add optional fields to turns:

```ts
export type DebateTurn = {
  id: string;
  speaker: string;
  content: string;
  referencedEvidenceIds: string[];
  side?: SpeakerSideKey;
  round?: number;
  analysis?: DebateTurnAnalysis;
  privateEvidenceIds?: string[];
};
```

Add analysis:

```ts
export type DebateTurnAnalysis = {
  factualIssues: string[];
  logicalIssues: string[];
  valueIssues: string[];
  searchFocus: string;
};
```

Add private evidence pools to the session:

```ts
export type PrivateEvidencePools = Partial<Record<SpeakerSideKey, Evidence[]>>;

export type SessionRecord = {
  evidence: Evidence[];
  privateEvidence?: PrivateEvidencePools;
  turns: DebateTurn[];
};
```

In `shared-evidence`, `evidence` remains the visible shared pool.

In `private-evidence`, `evidence` may hold a combined user-visible evidence list for display compatibility, but prompts must use only `privateEvidence[side]` for the speaking agent. If both structures exist, the orchestrator must treat private pools as authoritative for prompt construction.

## Prompting

Add an analysis prompt that returns structured JSON:

```json
{
  "factualIssues": ["..."],
  "logicalIssues": ["..."],
  "valueIssues": ["..."],
  "searchFocus": "..."
}
```

The analysis prompt receives:

- language;
- question;
- speaker identity;
- opponent's previous turn;
- prior visible debate turns;
- evidence visible to the analyzing agent.

For `private-evidence`, visible evidence means only the speaking agent's private pool.

The speech prompt should include the analysis result and tell the agent to respond to the strongest factual, logical, and value problems where relevant.

## Research

Shared mode:

- research writes to `session.evidence`;
- supplemental searches merge into the shared evidence pool.

Private mode:

- research writes to `session.privateEvidence[side]`;
- generated evidence IDs should remain globally unique;
- duplicate URLs can be deduplicated within each side's pool;
- prompts for one side must not include the other side's private evidence.

The session view can expose both the shared and private evidence so the UI and history can render the full process.

## History

History serialization should save:

- debate mode;
- turn analysis;
- turn side and round;
- shared evidence;
- private evidence pools.

History detail should show the expanded process:

- mode name;
- each turn's round and side;
- analysis before the speech when present;
- evidence used by that side;
- summary.

History loading must remain tolerant of older records with no mode, no private evidence, and no analysis. Those records should load as `共证衡辩`.

## Testing

Frontend tests:

- the sidebar taiji mark links to `/product`;
- `/product` renders product introduction content;
- the sidebar nav does not include a product-page nav item;
- the workspace frame includes the decorative background layer;
- the debate page can switch mode and submits the selected mode;
- switching first-level pages preserves the selected mode if it lives in workspace draft state.

Backend/domain tests:

- session creation defaults to `shared-evidence`;
- shared mode stores analysis before follow-up turns and uses shared evidence;
- private mode creates six turns for three rounds;
- private mode stores evidence in side-specific pools;
- private mode prompt construction never includes the opponent's private evidence;
- old history records without mode or analysis still load.

Verification:

- focused tests for UI mode switch and runtime orchestration;
- `pnpm test`;
- `pnpm build`;
- `git diff --check`.

## Open Decisions Resolved

- Product page entry: only the sidebar taiji mark links to `/product`; no nav item is added.
- Debate mode implementation depth: use real runtime orchestration, not frontend-only simulation.
- New mode name: `隔证三辩`.
- Existing mode name: `共证衡辩`.
