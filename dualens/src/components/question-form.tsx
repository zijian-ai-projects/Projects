"use client";

import { memo, useEffect, useState } from "react";
import Link from "next/link";
import { SectionCard } from "@/components/common/section-card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { SessionInput } from "@/components/session-shell";
import { loadActiveModelProviderDisplay } from "@/lib/model-provider-preferences";
import * as presetLibrary from "@/lib/presets";
import { loadActiveSearchEngineDisplay } from "@/lib/search-engine-preferences";
import { getLocalizedSideIdentityCopy } from "@/lib/side-identities";
import { getUiCopy } from "@/lib/ui-copy";
import type {
  DebateMode,
  SpeakerSideKey,
  TemperamentOption,
  TemperamentPairId,
  UiLanguage
} from "@/lib/types";

function readTrimmedField(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function QuestionFormImpl({
  onSubmit,
  uiLanguage: controlledUiLanguage,
  questionValue,
  onQuestionChange,
  presetSelectionValue,
  onPresetSelectionChange,
  firstSpeakerValue,
  onFirstSpeakerChange,
  debateModeValue,
  onDebateModeChange
}: {
  onSubmit(input: SessionInput): Promise<void>;
  uiLanguage?: UiLanguage;
  questionValue?: string;
  onQuestionChange?: (question: string) => void;
  presetSelectionValue?: SessionInput["presetSelection"];
  onPresetSelectionChange?: (presetSelection: SessionInput["presetSelection"]) => void;
  firstSpeakerValue?: SpeakerSideKey;
  onFirstSpeakerChange?: (firstSpeaker: SpeakerSideKey) => void;
  debateModeValue?: DebateMode;
  onDebateModeChange?: (debateMode: DebateMode) => void;
}) {
  const [localQuestion, setLocalQuestion] = useState("");
  const [localTemperamentPairId, setLocalTemperamentPairId] = useState<TemperamentPairId>(
    presetLibrary.TEMPERAMENT_PAIRS[0]?.id ?? "cautious-aggressive"
  );
  const [localLuminaTemperament, setLocalLuminaTemperament] = useState<TemperamentOption>(
    presetLibrary.TEMPERAMENT_PAIRS[0]?.options[0] ?? "cautious"
  );
  const [localFirstSpeaker, setLocalFirstSpeaker] = useState<SpeakerSideKey>("lumina");
  const [localDebateMode, setLocalDebateMode] = useState<DebateMode>("shared-evidence");
  const [selectedModelLabel, setSelectedModelLabel] = useState<string | null>(null);
  const [isSelectedModelConfigured, setIsSelectedModelConfigured] = useState(false);
  const [selectedSearchEngineLabel, setSelectedSearchEngineLabel] = useState<string | null>(null);
  const [isSelectedSearchEngineConfigured, setIsSelectedSearchEngineConfigured] = useState(false);
  const [isSwapActive, setIsSwapActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [questionError, setQuestionError] = useState(false);
  const uiLanguage = controlledUiLanguage ?? "zh-CN";
  const uiCopy = getUiCopy(uiLanguage);
  const question = questionValue ?? localQuestion;
  const setQuestion = onQuestionChange ?? setLocalQuestion;
  const localPresetSelection = {
    pairId: localTemperamentPairId,
    luminaTemperament: localLuminaTemperament
  } as SessionInput["presetSelection"];
  const presetSelection = presetSelectionValue ?? localPresetSelection;
  const temperamentPairId = presetSelection.pairId;
  const luminaTemperament = presetSelection.luminaTemperament as TemperamentOption;
  const firstSpeaker = firstSpeakerValue ?? localFirstSpeaker;
  const debateMode = debateModeValue ?? localDebateMode;
  const setPresetSelection = (nextPresetSelection: SessionInput["presetSelection"]) => {
    if (onPresetSelectionChange) {
      onPresetSelectionChange(nextPresetSelection);
      return;
    }

    setLocalTemperamentPairId(nextPresetSelection.pairId);
    setLocalLuminaTemperament(nextPresetSelection.luminaTemperament as TemperamentOption);
  };
  const setFirstSpeaker = (nextFirstSpeaker: SpeakerSideKey) => {
    if (onFirstSpeakerChange) {
      onFirstSpeakerChange(nextFirstSpeaker);
      return;
    }

    setLocalFirstSpeaker(nextFirstSpeaker);
  };
  const setDebateMode = (nextDebateMode: DebateMode) => {
    if (onDebateModeChange) {
      onDebateModeChange(nextDebateMode);
      return;
    }

    setLocalDebateMode(nextDebateMode);
  };
  const selectedPair =
    presetLibrary.getTemperamentPairById(temperamentPairId) ?? presetLibrary.TEMPERAMENT_PAIRS[0];
  const selectedLuminaLabel = presetLibrary.getLocalizedTemperamentOptionLabel(
    luminaTemperament,
    uiLanguage
  );
  const selectedVigilaTemperament = presetLibrary.getOppositeTemperament(selectedPair, luminaTemperament);
  const selectedVigilaLabel = presetLibrary.getLocalizedTemperamentOptionLabel(
    selectedVigilaTemperament,
    uiLanguage
  );
  const luminaIdentity = getLocalizedSideIdentityCopy("lumina", uiLanguage);
  const vigilaIdentity = getLocalizedSideIdentityCopy("vigila", uiLanguage);
  const minimumQuestionLength = uiLanguage === "en" ? 10 : 5;
  const tooShortQuestionMessage =
    uiLanguage === "en" ? "Question must be at least 10 characters." : "问题至少需要 5 个字符。";
  const sectionCopy =
    uiLanguage === "en"
      ? {
          questionTitle: "Question",
          questionDescription: "Describe the decision you want both agents to evaluate.",
          rolesTitle: "Role configuration",
          rolesDescription: "Confirm both stances and temperament before launching the debate.",
          actionTitle: "Action",
          actionDescription: "Confirm the runtime context and launch the session when ready.",
          pairLabel: "Temperament pair",
          currentModelLabel: "Current model",
          currentSearchEngineLabel: "Current search engine",
          unconfiguredLabel: "Not configured",
          debateModeLabel: "Debate mode",
          sharedEvidenceMode: "Shared evidence debate",
          privateEvidenceMode: "Private evidence three-round debate",
          styleLabel: "Style"
        }
      : {
          questionTitle: "问题输入区",
          questionDescription: "用一句清晰的问题定义本次需要判断的决策主题。",
          rolesTitle: "双角色配置区",
          rolesDescription: "确认双方立场与风格配对，保持双 AI 对辩结构清晰克制。",
          actionTitle: "操作区",
          actionDescription: "确认当前模型与搜索引擎后，正式启动辩论。",
          pairLabel: "风格配对",
          currentModelLabel: "当前模型",
          currentSearchEngineLabel: "当前搜索引擎",
          unconfiguredLabel: "未配置",
          debateModeLabel: "辩论模式",
          sharedEvidenceMode: "共证衡辩",
          privateEvidenceMode: "隔证三辩",
          styleLabel: "风格"
        };

  useEffect(() => {
    const modelDisplay = loadActiveModelProviderDisplay();
    const searchEngineDisplay = loadActiveSearchEngineDisplay();

    setSelectedModelLabel(modelDisplay.modelLabel);
    setIsSelectedModelConfigured(modelDisplay.configured);
    setSelectedSearchEngineLabel(searchEngineDisplay.engineName);
    setIsSelectedSearchEngineConfigured(searchEngineDisplay.configured);
  }, []);

  const handleSwapTemperament = () => {
    setPresetSelection({
      pairId: selectedPair.id,
      luminaTemperament: presetLibrary.getOppositeTemperament(selectedPair, luminaTemperament)
    } as SessionInput["presetSelection"]);
    setIsSwapActive((current) => !current);
  };

  const handleSelectPair = (pairId: TemperamentPairId) => {
    const pair = presetLibrary.getTemperamentPairById(pairId);
    if (!pair) {
      return;
    }

    setPresetSelection({
      pairId: pair.id,
      luminaTemperament: pair.options[0]
    } as SessionInput["presetSelection"]);
  };

  const getOrderLabel = (side: SpeakerSideKey) =>
    firstSpeaker === side ? uiCopy.speakingOrderFirst : uiCopy.speakingOrderSecond;

  const toggleSpeakingOrder = () => {
    setFirstSpeaker(firstSpeaker === "lumina" ? "vigila" : "lumina");
  };
  const modelSummary = isSelectedModelConfigured && selectedModelLabel
    ? selectedModelLabel
    : sectionCopy.unconfiguredLabel;
  const searchEngineSummary = isSelectedSearchEngineConfigured && selectedSearchEngineLabel
    ? selectedSearchEngineLabel
    : sectionCopy.unconfiguredLabel;
  const debateModeLabel =
    debateMode === "private-evidence"
      ? sectionCopy.privateEvidenceMode
      : sectionCopy.sharedEvidenceMode;
  const nextDebateMode = debateMode === "shared-evidence" ? "private-evidence" : "shared-evidence";
  const runtimeCardClass =
    "w-fit min-w-[128px] max-w-[220px] rounded-[16px] border border-app-line bg-app-soft px-3 py-2 text-left transition hover:border-app-strong/20 hover:bg-app-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus/15";
  const runtimeControls = (
    <div
      data-testid="debate-action-row"
      className="flex flex-wrap items-start justify-end gap-3 lg:justify-end"
    >
      <Link
        href="/providers"
        aria-label={`${sectionCopy.currentModelLabel}: ${modelSummary}`}
        className={runtimeCardClass}
      >
        <p className="text-[11px] uppercase tracking-[0.16em] text-app-muted">
          {sectionCopy.currentModelLabel}
        </p>
        <p className="mt-1 break-words text-sm font-medium text-app-strong">
          {modelSummary}
        </p>
      </Link>
      <Link
        href="/search-engines"
        aria-label={`${sectionCopy.currentSearchEngineLabel}: ${searchEngineSummary}`}
        className={runtimeCardClass}
      >
        <p className="text-[11px] uppercase tracking-[0.16em] text-app-muted">
          {sectionCopy.currentSearchEngineLabel}
        </p>
        <p className="mt-1 break-words text-sm font-medium text-app-strong">
          {searchEngineSummary}
        </p>
      </Link>
      <button
        type="button"
        data-testid="debate-mode-switch"
        className={`${runtimeCardClass} bg-app-card`}
        aria-label={`${sectionCopy.debateModeLabel}: ${debateModeLabel}`}
        onClick={() => setDebateMode(nextDebateMode)}
      >
        <p className="text-[11px] uppercase tracking-[0.16em] text-app-muted">
          {sectionCopy.debateModeLabel}
        </p>
        <p className="mt-1 break-words text-sm font-medium text-app-strong">
          {debateModeLabel}
        </p>
      </button>
      <div className="flex justify-end lg:shrink-0">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? uiCopy.startingDebate : uiCopy.startDebate}
        </Button>
      </div>
    </div>
  );

  return (
    <form
      className="grid gap-6"
      onSubmit={async (event) => {
        event.preventDefault();
        setQuestionError(false);
        const formData = new FormData(event.currentTarget);
        const trimmedQuestion = readTrimmedField(formData, "question");
        if (trimmedQuestion.length < minimumQuestionLength) {
          setQuestionError(true);
          return;
        }

        setIsSubmitting(true);
        try {
          const input: SessionInput = {
            question: trimmedQuestion,
            debateMode,
            presetSelection: {
              pairId: temperamentPairId,
              luminaTemperament
            } as SessionInput["presetSelection"],
            firstSpeaker,
            language: uiLanguage,
            model: loadActiveModelProviderDisplay().modelLabel
          };

          await onSubmit(input);
        } finally {
          setIsSubmitting(false);
        }
      }}
    >
      <SectionCard title={sectionCopy.questionTitle} description={sectionCopy.questionDescription}>
        <div className="space-y-3">
          <label htmlFor="question" className="block text-sm font-medium text-app-strong">
            {uiCopy.decisionQuestion}
          </label>
          <Textarea
            id="question"
            name="question"
            value={question}
            onChange={(event) => {
              setQuestion(event.target.value);
              if (questionError) {
                setQuestionError(false);
              }
            }}
            placeholder={uiCopy.questionPlaceholder}
            aria-invalid={questionError || undefined}
            rows={4}
          />
          {questionError ? (
            <p className="text-sm text-app-strong" role="alert">
              {tooShortQuestionMessage}
            </p>
          ) : null}
        </div>
      </SectionCard>

      <SectionCard
        title={sectionCopy.rolesTitle}
        description={sectionCopy.rolesDescription}
        action={
          <div className="w-full lg:w-[220px]">
            <label className="space-y-2 text-sm font-medium text-app-strong">
              <span>{sectionCopy.pairLabel}</span>
              <Select
                aria-label={uiCopy.chooseTemperamentPair}
                value={temperamentPairId}
                onChange={(event) => handleSelectPair(event.target.value as TemperamentPairId)}
              >
                {presetLibrary.TEMPERAMENT_PAIRS.map((pair) => (
                  <option key={pair.id} value={pair.id}>
                    {presetLibrary.getLocalizedTemperamentPairLabel(pair, uiLanguage)}
                  </option>
                ))}
              </Select>
            </label>
          </div>
        }
      >
        <div
          data-testid="role-config-grid"
          className="grid w-full max-w-none gap-3 xl:grid-cols-[minmax(0,1fr)_64px_minmax(0,1fr)] xl:items-center"
        >
          <section className="rounded-[20px] border border-app-strong bg-app-card px-4 py-3 shadow-app-soft">
            <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-start gap-2">
              <div className="min-w-0">
                <div className="text-base font-semibold text-app-strong">{luminaIdentity.name}</div>
                <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-app-muted">
                  {luminaIdentity.descriptor}
                </div>
              </div>
              <button
                type="button"
                className="rounded-[8px] border border-app-strong bg-app-card px-3 py-1 text-xs font-medium text-app-strong transition hover:bg-app-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus"
                onClick={toggleSpeakingOrder}
              >
                {getOrderLabel("lumina")}
              </button>
              <div className="inline-flex rounded-[8px] border border-app-strong bg-app-card px-3 py-1 text-xs font-medium text-app-strong">
                {selectedLuminaLabel}
              </div>
            </div>
          </section>

          <div className="flex items-center justify-center">
            <button
              type="button"
              aria-label={uiCopy.swapTemperamentAssignment}
              aria-pressed={isSwapActive}
              className={[
                "flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[8px] border p-0 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus disabled:cursor-not-allowed disabled:opacity-50",
                isSwapActive
                  ? "border-app-strong bg-app-strong text-app-inverse"
                  : "border-app-line bg-app-card text-app-strong"
              ].join(" ")}
              onClick={handleSwapTemperament}
            >
              <span
                data-testid="temperament-swap-icon"
                className={[
                  "flex h-full w-full items-center justify-center rounded-[8px] text-sm font-semibold lowercase tracking-[0.06em]",
                  isSwapActive ? "text-app-inverse" : "text-app-strong"
                ].join(" ")}
              >
                {uiCopy.swapButtonText}
              </span>
            </button>
          </div>

          <section className="rounded-[20px] border border-app-strong bg-app-strong px-4 py-3 shadow-[0_8px_20px_var(--shadow-strong)]">
            <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-start gap-2">
              <div className="min-w-0">
                <div className="text-base font-semibold text-app-inverse">{vigilaIdentity.name}</div>
                <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-app-inverse/60">
                  {vigilaIdentity.descriptor}
                </div>
              </div>
              <button
                type="button"
                className="rounded-[8px] border border-app-inverse/28 bg-app-strong px-3 py-1 text-xs font-medium text-app-inverse transition hover:bg-app-inverse/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-inverse/20"
                onClick={toggleSpeakingOrder}
              >
                {getOrderLabel("vigila")}
              </button>
              <div className="inline-flex rounded-[8px] border border-app-inverse bg-transparent px-3 py-1 text-xs font-medium text-app-inverse">
                {selectedVigilaLabel}
              </div>
            </div>
          </section>
        </div>
      </SectionCard>

      <SectionCard
        title={sectionCopy.actionTitle}
        description={sectionCopy.actionDescription}
        action={runtimeControls}
      >
        {null}
      </SectionCard>
    </form>
  );
}

export const QuestionForm = memo(QuestionFormImpl);
