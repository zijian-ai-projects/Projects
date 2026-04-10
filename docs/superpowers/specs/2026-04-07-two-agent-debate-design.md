# Two Agent Debate Design

Date: 2026-04-07

## Overview

This project is a local-first web application for ordinary users who want help thinking through real-world decisions. The product uses two AI agents to debate a user-provided question, but the debate is not free-form roleplay or empty rhetoric. The system must search for public information, extract usable evidence, let both agents argue from that evidence, and then produce a practical summary for the user.

The core product value is not "watching AIs argue." The core value is helping a user understand the strongest reasons for and against a decision, the unresolved uncertainties, and the most useful next step.

## Product Goals

- Help users think through real decisions by presenting evidence-backed arguments from two contrasting perspectives.
- Prioritize practical summaries over theatrical debate.
- Keep the default experience simple enough for non-technical users.
- Preserve advanced configuration for users who want to choose models, prompts, and API providers.
- Start local-first while keeping a clean path to a future deployable web product.

## Non-Goals For MVP

- User accounts
- Cloud sync
- Social sharing or community features
- Multiplayer sessions
- Judge or winner scoring system
- Leaderboards
- User-uploaded PDFs or private document retrieval
- Complex personality simulation systems
- Evidence graph visualization
- Mobile native app
- Platform-managed API keys

## Primary User

The first target user is an ordinary user trying to think through a real question such as:

- Should I quit my job and start a company?
- Should I move to another city?
- Should I buy a more expensive laptop now?

The product should feel like a decision support tool, not a developer console.

## Core Product Definition

The MVP is an evidence-driven dual-agent decision assistant:

1. The user enters a decision question.
2. The system normalizes the question and identifies key decision dimensions.
3. The system performs an initial shared web search across public sources.
4. The system extracts and structures evidence into a common evidence pool.
5. Two agents debate from different decision styles or viewpoints using the shared evidence.
6. Agents may trigger supplemental search during later rounds when needed.
7. The user may inject a new premise during the debate.
8. The system ends the debate after controlled rounds or early convergence.
9. A separate summarization step produces a practical final summary with evidence attached to the most important judgments.

## UX Principles

- Default to simplicity.
- Hide advanced controls behind an expandable section.
- Make the summary more visually important than the raw debate transcript.
- Make evidence visible and inspectable, but not overwhelming.
- Prefer structured turns over open-ended chat.
- Show users why a conclusion exists and which evidence supports it.

## User Flow

### 1. Landing And Input

The user sees:

- A prominent input field for the question
- A small set of example prompts
- A preset debate mode selector
- A start button
- A collapsed advanced settings entry point

### 2. Optional Advanced Setup

Advanced settings allow the user to configure:

- API base URL
- API key
- model name for Agent A
- model name for Agent B
- optional summarizer model
- role templates or editable role prompts
- round count
- source strategy
- search depth
- summary style

These settings should not dominate the default interface.

### 3. Shared Research Phase

Before the debate begins, the system performs a shared search and builds a structured evidence pool. This establishes a common factual baseline and prevents the debate from becoming pure speculation.

### 4. Debate Phase

The agents begin with opening positions using the shared evidence. Later rounds focus on specific points of disagreement. The user may add a premise during the debate, which becomes part of the active session context.

### 5. Summary Phase

The system exits the debate and enters a summary step. The user sees:

- strongest reasons supporting the decision
- strongest reasons against the decision
- key unresolved uncertainties
- main point of disagreement
- recommended next action

The most important summary judgments should cite evidence already surfaced during the session.

## Page Structure

The MVP should use a single-page application layout with four primary regions:

### Top Input Section

- decision question input
- preset mode selector
- start action

### Collapsed Advanced Settings Section

- provider and API settings
- model settings
- role configuration
- search and summary settings

### Main Debate Section

The debate section should display a structured left-right debate timeline rather than a generic chat interface.

Each turn should show:

- speaking agent
- current debate point
- turn content
- expandable linked evidence

### Evidence Side Panel

This panel should show:

- shared evidence gathered at the beginning
- later supplemental evidence
- title
- source
- source type
- short summary
- which turns referenced the evidence

### Final Summary Section

This section should be visually stronger and calmer than the debate area. It is the main output of the product.

## Debate Structure

The debate must be controlled and staged rather than free-form.

### Full Session Stages

1. Question normalization
2. Shared search
3. Opening positions
4. Structured rebuttal rounds
5. Final summary generation

### Question Normalization

The system transforms the user question into a more useful internal representation:

- decision question
- known premises
- likely decision dimensions

For example, a startup decision might introduce dimensions such as savings, industry timing, family responsibilities, and failure risk.

### Shared Search

The system performs one initial search pass and constructs a shared evidence package. Search should prefer credible sources by default, with an optional full-web mode.

### Opening Positions

Agent A and Agent B each present an initial stance using the shared evidence pool. The purpose of this phase is to establish the strongest starting case for each side.

### Rebuttal Rounds

Later rounds should be point-driven. Each round centers on a concrete issue such as:

- cost
- risk
- long-term upside
- timing
- alternatives

Within each round:

1. The orchestrator identifies the current point of dispute.
2. The active speaking agent presents a claim with 1-2 supporting evidence items.
3. The responding agent challenges the reasoning, offers a counter-interpretation, or brings in new evidence.
4. The system records a compact round summary for future rounds and the final summary step.

### Supplemental Search

Supplemental search should be conditional, not mandatory every round.

Triggers may include:

- missing evidence for a current debate point
- a genuinely new line of argument
- a user-added premise
- conflicting evidence that requires clarification

## Debate End Conditions

The MVP should use fixed rounds as the primary stopping rule, with convergence checks as secondary signals.

### Recommended End Rule

- default to 3 rounds total after the shared research step
- allow early stop if arguments have become repetitive or the dispute has narrowed enough
- always allow the user to end the debate manually and enter summary mode

The system should not attempt to end only when one side has "nothing left to say." That condition is unreliable for model-driven debate and would cause unstable session length.

## Evidence Model

Evidence should be a first-class structured object, not just copied text in prompts.

Each evidence item should include:

- title
- URL
- source name
- source type
- short summary
- notable data points
- quoted or extracted passage
- tags or topic hints
- first appearance stage

All evidence used in the debate should live in one shared evidence pool, even if one side found it through supplemental search.

## Source Strategy

The default source policy should be "credible sources first."

Preferred sources include:

- government sources
- research institutions
- official company sources
- established news organizations

The user may switch to a broader web mode, but credible-first should remain the default.

## Summary Strategy

The final summary should be produced by a dedicated summarization step, not by either debating agent.

The summarizer should use:

- the normalized user question
- the debate transcript
- round summaries
- evidence referenced during the debate

The summarizer must not introduce brand-new evidence that the user never saw during the debate process.

### Summary Output Shape

The summary should include:

- strongest reasons in favor
- strongest reasons against
- core disagreement
- key uncertainty or unknown
- recommended next action

Only the most important judgments need hard evidence attachment in the MVP.

## Role Design

The system should avoid overly abstract "personality" controls in the default experience.

Instead, internal role design should be based on:

- decision tendency
- reasoning style
- expression style

Public-facing presets may include:

- cautious vs aggressive
- realistic vs idealistic
- cost-focused vs upside-focused
- data-oriented vs anecdote-oriented

These presets may be implemented internally as prompt templates.

## Configurability

### Default User Experience

Visible by default:

- question input
- preset role pair
- start button

### Advanced Settings

Exposed in the expandable area:

- provider/base URL
- API key
- model for each agent
- optional summarizer model
- role prompt editing
- round count
- search depth
- source strategy
- summary style

### Hidden Or Deferred Settings

The MVP should not expose low-level generation parameters such as:

- temperature
- top_p
- penalty tuning
- retrieval reranking internals
- prompt chain editing for orchestration logic

These are system tuning concerns, not default product controls.

## System Roles And Responsibilities

### Orchestrator

Responsible for:

- question normalization
- search triggering
- round planning
- convergence checks
- handoff to summary

### Research Layer

Responsible for:

- web search
- page fetching
- content extraction
- evidence structuring
- lightweight evidence tagging

### Agent A

Responsible for generating stance-specific argumentation using the available evidence and current debate point.

### Agent B

Responsible for generating an opposing or contrasting stance using the same debate context and evidence.

### Summarizer

Responsible for producing the final output for the user. This is a system step, not a visible judge persona.

## Frontend / Backend Boundary

### Frontend Responsibilities

- question input
- preset selection
- advanced settings forms
- debate timeline rendering
- evidence panel rendering
- final summary rendering
- user-injected premise input
- manual stop or continue actions

### Local Backend Responsibilities

- secure runtime use of API configuration
- LLM provider calls
- search provider calls
- page retrieval and text extraction
- evidence structuring
- session orchestration
- session state management
- summary generation

This project should remain local-first for the MVP, but the architecture should leave room for later deployment as a hosted product.

## Core Data Objects

The MVP should define at least these internal objects:

### Session

- user question
- normalized question
- current status
- current stage
- user-added premises
- selected roles
- final summary

### Evidence

- evidence id
- title
- URL
- source name
- source type
- summary
- extracted passage
- data points
- tags

### Turn

- turn id
- debate point
- speaker
- response target
- content
- referenced evidence ids
- round summary

### Config

- provider information
- API key
- model names
- role templates
- round count
- search mode
- source strategy
- summary style

## MVP Milestones

### Milestone 1: End-To-End Skeleton

Goal:

Run the full flow from question input to dual-agent summary, even with simple UI.

### Milestone 2: Research And Evidence Layer

Goal:

Make the debate evidence-driven with shared search, extraction, evidence objects, and citation-aware outputs.

### Milestone 3: Product UI

Goal:

Turn the workflow into a usable product with debate timeline, evidence panel, and summary-first layout.

### Milestone 4: Stability And Product Finish

Goal:

Add error handling, empty states, retries, config validation, and basic export support.

## Recommended Technical Direction

### Frontend

Use either:

- Next.js
- React + Vite

Preferred direction for this project:

- Next.js front end with a local API service or local backend companion

Reason:

This keeps the UI product-oriented while preserving a clean path to later deployment.

### Backend

Preferred direction:

- Node.js with TypeScript

Reason:

- shared language across frontend and backend
- good fit for provider abstractions and orchestration
- suitable for streaming UI and structured workflow logic

### Search And Extraction

The search and webpage extraction layers should remain provider-agnostic where possible. The product should not hardcode one irreversible search path into the architecture.

### Session State

Session state should live in the local backend rather than the frontend. This includes debate progress, evidence pool, and summary state.

## Open Risks

- search quality may vary significantly by provider
- content extraction quality will strongly affect evidence usefulness
- the debate may still become repetitive without strong orchestration rules
- summary usefulness depends on keeping debate rounds concise and evidence-linked
- too many visible settings would quickly turn the product into a developer tool instead of a user-facing app

## Decision Summary

This MVP should be built as a local-first, evidence-driven, two-agent decision debate web app with:

- ordinary users as the primary audience
- practical summaries as the primary output
- public web search as the first research mode
- credible sources first by default
- structured debate rounds instead of free-form chat
- advanced configuration hidden behind an expandable section
- a dedicated summarization step rather than a visible judge agent

## Next Step

After this design is approved, the next step is to create an implementation plan and then begin coding against the agreed MVP boundaries.
