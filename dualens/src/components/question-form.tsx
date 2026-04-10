"use client";

import { memo, useState } from "react";
import { SectionCard } from "@/components/common/section-card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { SessionInput } from "@/components/session-shell";
import * as presetLibrary from "@/lib/presets";
import { getLocalizedSideIdentityCopy } from "@/lib/side-identities";
import { getUiCopy } from "@/lib/ui-copy";
import type {
  BuiltInModel,
  SpeakerSideKey,
  TemperamentOption,
  TemperamentPairId,
  UiLanguage
} from "@/lib/types";

const BUILT_IN_MODELS: readonly BuiltInModel[] = ["deepseek-chat", "deepseek-reasoner"];

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
  const [model, setModel] = useState<BuiltInModel>(BUILT_IN_MODELS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [questionError, setQuestionError] = useState(false);
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
          rolesDescription: "Assign the stance framing, temperament pair, and speaking order for each side.",
          modelTitle: "Model and parameters",
          modelDescription: "Choose the model and confirm the current debate structure before launch.",
          actionTitle: "Action",
          actionDescription: "Review the current setup and launch the session when ready.",
          pairLabel: "Temperament pair",
          debateLanguageLabel: "Session language",
          debateLanguageValue: uiLanguage === "en" ? "English" : "中文",
          structureLabel: "Debate structure",
          structureValue: "Research → Debate → Summary",
          assignmentLabel: "Current assignment",
          orderLabel: "Speaking order"
        }
      : {
          questionTitle: "问题输入区",
          questionDescription: "用一句清晰的问题定义本次需要判断的决策主题。",
          rolesTitle: "双角色配置区",
          rolesDescription: "为双方设定立场、风格配对与发言顺序，强化双 AI 对辩感。",
          modelTitle: "模型与参数区",
          modelDescription: "选择当前辩论所用模型，并确认本次流程结构。",
          actionTitle: "操作区",
          actionDescription: "最后检查当前设置，再正式启动辩论。",
          pairLabel: "风格配对",
          debateLanguageLabel: "会话语言",
          debateLanguageValue: "中文",
          structureLabel: "辩论结构",
          structureValue: "研究 → 辩论 → 总结",
          assignmentLabel: "当前分配",
          orderLabel: "发言顺序"
        };
  const handleSwapTemperament = () => {
    setLuminaTemperament(presetLibrary.getOppositeTemperament(selectedPair, luminaTemperament));
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
            model
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
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_88px_minmax(0,1fr)] xl:items-center">
          <section className="rounded-[24px] border border-black/8 bg-white px-5 py-5 shadow-[0_10px_24px_rgba(0,0,0,0.03)]">
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-base font-semibold text-app-strong">{luminaIdentity.name}</div>
                  <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-app-muted">
                    {luminaIdentity.descriptor}
                  </div>
                </div>
                <button
                  type="button"
                  className="rounded-full border border-black bg-black px-3 py-1 text-xs font-semibold text-white transition hover:bg-black/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
                  onClick={toggleSpeakingOrder}
                >
                  {getOrderLabel("lumina")}
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[18px] border border-black/8 bg-black/[0.02] px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-app-muted">{sectionCopy.assignmentLabel}</p>
                  <p className="mt-2 text-sm font-medium text-app-strong">{selectedLuminaLabel}</p>
                </div>
                <div className="rounded-[18px] border border-black/8 bg-black/[0.02] px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-app-muted">{sectionCopy.orderLabel}</p>
                  <p className="mt-2 text-sm font-medium text-app-strong">{getOrderLabel("lumina")}</p>
                </div>
              </div>
            </div>
          </section>

          <div className="flex items-center justify-center">
            <Button
              type="button"
              variant="ghost"
              aria-label={uiCopy.swapTemperamentAssignment}
              className="h-[58px] w-[58px] shrink-0 rounded-full border border-black/12 bg-white p-0 text-black hover:bg-white/90 hover:text-black"
              onClick={handleSwapTemperament}
            >
              <span
                data-testid="temperament-swap-icon"
                className="flex h-full w-full items-center justify-center rounded-full text-sm font-semibold lowercase tracking-[0.06em] text-black"
              >
                {uiCopy.swapButtonText}
              </span>
            </Button>
          </div>

          <section className="rounded-[24px] border border-black bg-black px-5 py-5 shadow-[0_10px_24px_rgba(0,0,0,0.08)]">
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-base font-semibold text-white">{vigilaIdentity.name}</div>
                  <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-white/60">
                    {vigilaIdentity.descriptor}
                  </div>
                </div>
                <button
                  type="button"
                  className="rounded-full border border-white/16 bg-white px-3 py-1 text-xs font-semibold text-black transition hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
                  onClick={toggleSpeakingOrder}
                >
                  {getOrderLabel("vigila")}
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[18px] border border-white/10 bg-white/[0.08] px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-white/55">{sectionCopy.assignmentLabel}</p>
                  <p className="mt-2 text-sm font-medium text-white">{selectedVigilaLabel}</p>
                </div>
                <div className="rounded-[18px] border border-white/10 bg-white/[0.08] px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-white/55">{sectionCopy.orderLabel}</p>
                  <p className="mt-2 text-sm font-medium text-white">{getOrderLabel("vigila")}</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </SectionCard>

      <SectionCard title={sectionCopy.modelTitle} description={sectionCopy.modelDescription}>
        <div className="grid gap-4 lg:grid-cols-3">
          <label className="space-y-2 text-sm font-medium text-app-strong">
            <span className="block">{uiCopy.model}</span>
            <Select value={model} onChange={(event) => setModel(event.target.value as BuiltInModel)}>
              {BUILT_IN_MODELS.map((builtInModel) => (
                <option key={builtInModel} value={builtInModel}>
                  {builtInModel}
                </option>
              ))}
            </Select>
          </label>
          <div className="rounded-[20px] border border-black/8 bg-black/[0.02] px-4 py-4">
            <p className="text-[11px] uppercase tracking-[0.16em] text-app-muted">{sectionCopy.debateLanguageLabel}</p>
            <p className="mt-2 text-sm font-medium text-app-strong">{sectionCopy.debateLanguageValue}</p>
          </div>
          <div className="rounded-[20px] border border-black/8 bg-black/[0.02] px-4 py-4">
            <p className="text-[11px] uppercase tracking-[0.16em] text-app-muted">{sectionCopy.structureLabel}</p>
            <p className="mt-2 text-sm font-medium text-app-strong">{sectionCopy.structureValue}</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title={sectionCopy.actionTitle} description={sectionCopy.actionDescription}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2 text-sm text-app-muted">
            <span className="rounded-full border border-black/8 bg-black/[0.03] px-3 py-2">
              {luminaIdentity.name} · {selectedLuminaLabel}
            </span>
            <span className="rounded-full border border-black/8 bg-black/[0.03] px-3 py-2">
              {vigilaIdentity.name} · {selectedVigilaLabel}
            </span>
            <span className="rounded-full border border-black/8 bg-black/[0.03] px-3 py-2">{model}</span>
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? uiCopy.startingDebate : uiCopy.startDebate}
          </Button>
        </div>
      </SectionCard>
    </form>
  );
}

export const QuestionForm = memo(QuestionFormImpl);
