"use client";

import { memo, useEffect, useRef, useState } from "react";
import { SectionCard } from "@/components/common/section-card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { SessionInput } from "@/components/session-shell";
import * as presetLibrary from "@/lib/presets";
import { loadSelectedSearchEngineLabel } from "@/lib/search-engine-preferences";
import { getLocalizedSideIdentityCopy } from "@/lib/side-identities";
import { getUiCopy } from "@/lib/ui-copy";
import type {
  BuiltInModel,
  SpeakerSideKey,
  TemperamentOption,
  TemperamentPairId,
  UiLanguage
} from "@/lib/types";

const DEFAULT_MODEL: BuiltInModel = "deepseek-chat";

function readTrimmedField(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function QuestionFormImpl({
  onSubmit,
  uiLanguage: controlledUiLanguage
}: {
  onSubmit(input: SessionInput): Promise<void>;
  uiLanguage?: UiLanguage;
}) {
  const [question, setQuestion] = useState("");
  const [temperamentPairId, setTemperamentPairId] = useState<TemperamentPairId>(
    presetLibrary.TEMPERAMENT_PAIRS[0]?.id ?? "cautious-aggressive"
  );
  const [luminaTemperament, setLuminaTemperament] = useState<TemperamentOption>(
    presetLibrary.TEMPERAMENT_PAIRS[0]?.options[0] ?? "cautious"
  );
  const [firstSpeaker, setFirstSpeaker] = useState<SpeakerSideKey>("lumina");
  const [selectedSearchEngineLabel, setSelectedSearchEngineLabel] = useState<string | null>(null);
  const [isSwapActive, setIsSwapActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [questionError, setQuestionError] = useState(false);
  const swapResetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const uiLanguage = controlledUiLanguage ?? "zh-CN";
  const uiCopy = getUiCopy(uiLanguage);
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
  const tooShortQuestionMessage =
    uiLanguage === "en" ? "Question must be at least 10 characters." : "问题至少需要 10 个字符。";
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
          searchEngineLoadingLabel: "Syncing",
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
          searchEngineLoadingLabel: "同步中",
          styleLabel: "风格"
        };

  useEffect(() => {
    setSelectedSearchEngineLabel(loadSelectedSearchEngineLabel());
  }, []);

  useEffect(
    () => () => {
      if (swapResetTimeoutRef.current) {
        clearTimeout(swapResetTimeoutRef.current);
      }
    },
    []
  );

  const handleSwapTemperament = () => {
    setLuminaTemperament(presetLibrary.getOppositeTemperament(selectedPair, luminaTemperament));
    setIsSwapActive(true);

    if (swapResetTimeoutRef.current) {
      clearTimeout(swapResetTimeoutRef.current);
    }

    swapResetTimeoutRef.current = setTimeout(() => {
      setIsSwapActive(false);
    }, 260);
  };

  const handleSelectPair = (pairId: TemperamentPairId) => {
    const pair = presetLibrary.getTemperamentPairById(pairId);
    if (!pair) {
      return;
    }

    setTemperamentPairId(pair.id);
    setLuminaTemperament(pair.options[0]);
  };

  const getOrderLabel = (side: SpeakerSideKey) =>
    firstSpeaker === side ? uiCopy.speakingOrderFirst : uiCopy.speakingOrderSecond;

  const toggleSpeakingOrder = () => {
    setFirstSpeaker((current) => (current === "lumina" ? "vigila" : "lumina"));
  };

  return (
    <form
      className="grid gap-6"
      onSubmit={async (event) => {
        event.preventDefault();
        setQuestionError(false);
        const formData = new FormData(event.currentTarget);
        const trimmedQuestion = readTrimmedField(formData, "question");
        if (trimmedQuestion.length < 10) {
          setQuestionError(true);
          return;
        }

        setIsSubmitting(true);
        try {
          const input: SessionInput = {
            question: trimmedQuestion,
            presetSelection: {
              pairId: temperamentPairId,
              luminaTemperament
            } as SessionInput["presetSelection"],
            firstSpeaker,
            language: uiLanguage,
            model: DEFAULT_MODEL
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
            <p className="text-sm text-black" role="alert">
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
        <div className="mx-auto grid w-full max-w-[980px] gap-3 xl:grid-cols-[minmax(0,0.92fr)_64px_minmax(0,0.92fr)] xl:items-center">
          <section className="rounded-[20px] border border-black bg-white px-4 py-3 shadow-[0_8px_18px_rgba(0,0,0,0.022)]">
            <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-start gap-2">
              <div className="min-w-0">
                <div className="text-base font-semibold text-app-strong">{luminaIdentity.name}</div>
                <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-app-muted">
                  {luminaIdentity.descriptor}
                </div>
              </div>
              <button
                type="button"
                className="rounded-full border border-black bg-white px-3 py-1 text-xs font-medium text-black transition hover:bg-black/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/10"
                onClick={toggleSpeakingOrder}
              >
                {getOrderLabel("lumina")}
              </button>
              <div className="inline-flex rounded-full border border-black bg-white px-3 py-1 text-xs font-medium text-black">
                {selectedLuminaLabel}
              </div>
            </div>
          </section>

          <div className="flex items-center justify-center">
            <Button
              type="button"
              variant="ghost"
              aria-label={uiCopy.swapTemperamentAssignment}
              aria-pressed={isSwapActive}
              className={[
                "h-[52px] w-[52px] shrink-0 rounded-full border p-0 hover:bg-black hover:text-white",
                isSwapActive
                  ? "border-black bg-black text-white"
                  : "border-black/12 bg-white text-black hover:bg-white/90 hover:text-black"
              ].join(" ")}
              onClick={handleSwapTemperament}
            >
              <span
                data-testid="temperament-swap-icon"
                className={[
                  "flex h-full w-full items-center justify-center rounded-full text-sm font-semibold lowercase tracking-[0.06em]",
                  isSwapActive ? "text-white" : "text-black"
                ].join(" ")}
              >
                {uiCopy.swapButtonText}
              </span>
            </Button>
          </div>

          <section className="rounded-[20px] border border-black bg-black px-4 py-3 shadow-[0_8px_20px_rgba(0,0,0,0.06)]">
            <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-start gap-2">
              <div className="min-w-0">
                <div className="text-base font-semibold text-white">{vigilaIdentity.name}</div>
                <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-white/60">
                  {vigilaIdentity.descriptor}
                </div>
              </div>
              <button
                type="button"
                className="rounded-full border border-white/28 bg-black px-3 py-1 text-xs font-medium text-white transition hover:bg-white/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
                onClick={toggleSpeakingOrder}
              >
                {getOrderLabel("vigila")}
              </button>
              <div className="inline-flex rounded-full border border-white bg-transparent px-3 py-1 text-xs font-medium text-white">
                {selectedVigilaLabel}
              </div>
            </div>
          </section>
        </div>
      </SectionCard>

      <SectionCard title={sectionCopy.actionTitle} description={sectionCopy.actionDescription}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[460px]">
            <div className="rounded-[18px] border border-black/8 bg-black/[0.03] px-4 py-2.5">
              <p className="text-[11px] uppercase tracking-[0.16em] text-app-muted">
                {sectionCopy.currentModelLabel}
              </p>
              <p className="mt-1 text-sm font-medium text-app-strong">{DEFAULT_MODEL}</p>
            </div>
            <div className="rounded-[18px] border border-black/8 bg-black/[0.03] px-4 py-2.5">
              <p className="text-[11px] uppercase tracking-[0.16em] text-app-muted">
                {sectionCopy.currentSearchEngineLabel}
              </p>
              <p className="mt-1 text-sm font-medium text-app-strong">
                {selectedSearchEngineLabel ?? sectionCopy.searchEngineLoadingLabel}
              </p>
            </div>
          </div>
          <div className="flex justify-start lg:justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? uiCopy.startingDebate : uiCopy.startDebate}
            </Button>
          </div>
        </div>
      </SectionCard>
    </form>
  );
}

export const QuestionForm = memo(QuestionFormImpl);
