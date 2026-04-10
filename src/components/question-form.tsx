"use client";

import { memo, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  const [pairMenuSide, setPairMenuSide] = useState<SpeakerSideKey | null>(null);
  const luminaPairMenuRegionRef = useRef<HTMLDivElement | null>(null);
  const vigilaPairMenuRegionRef = useRef<HTMLDivElement | null>(null);
  const [model, setModel] = useState<BuiltInModel>(BUILT_IN_MODELS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
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
  const handleSwapTemperament = () => {
    setLuminaTemperament(presetLibrary.getOppositeTemperament(selectedPair, luminaTemperament));
  };

  const togglePairMenu = (side: SpeakerSideKey) => {
    setPairMenuSide((current) => (current === side ? null : side));
  };

  const handleSelectPair = (pairId: TemperamentPairId) => {
    const pair = presetLibrary.getTemperamentPairById(pairId);
    if (!pair) {
      return;
    }

    setTemperamentPairId(pair.id);
    setLuminaTemperament(pair.options[0]);
    setPairMenuSide(null);
  };

  useEffect(() => {
    if (pairMenuSide === null) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      const activeRegion =
        pairMenuSide === "lumina" ? luminaPairMenuRegionRef.current : vigilaPairMenuRegionRef.current;
      if (activeRegion && target && !activeRegion.contains(target)) {
        setPairMenuSide(null);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [pairMenuSide]);

  const getOrderLabel = (side: SpeakerSideKey) =>
    firstSpeaker === side ? uiCopy.speakingOrderFirst : uiCopy.speakingOrderSecond;

  const toggleSpeakingOrder = () => {
    setFirstSpeaker((current) => (current === "lumina" ? "vigila" : "lumina"));
  };

  const renderPairMenu = (menuSide: SpeakerSideKey, dark: boolean) =>
    pairMenuSide === menuSide ? (
      <div
        id="temperament-pair-menu"
        role="menu"
        aria-label={uiCopy.chooseTemperamentPair}
        className={[
          "absolute right-0 top-full z-20 mt-1 w-full rounded-2xl border p-2 shadow-[0_18px_44px_rgba(21,21,21,0.12)]",
          dark ? "border-white/12 bg-black text-white" : "border-black/10 bg-paper text-ink"
        ].join(" ")}
      >
        {presetLibrary.TEMPERAMENT_PAIRS.map((pair) => (
          <button
            key={pair.id}
            type="button"
            className={[
              "flex w-full justify-center rounded-xl px-3 py-2 text-center text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60",
              dark ? "hover:bg-white/10" : "hover:bg-black/5"
            ].join(" ")}
            onClick={() => handleSelectPair(pair.id)}
          >
            {presetLibrary.getLocalizedTemperamentPairLabel(pair, uiLanguage)}
          </button>
        ))}
      </div>
    ) : null;

  return (
    <Card className="space-y-6">
      <CardContent className="space-y-5">
        <form
          className="space-y-5"
          onSubmit={async (event) => {
            event.preventDefault();
            setQuestionError(false);
            setSubmissionError(null);
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
          <div className="space-y-3">
            <label htmlFor="question" className="block text-sm font-medium text-ink/80">
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
              <p className="text-sm text-red-700" role="alert">
                {tooShortQuestionMessage}
              </p>
            ) : null}
          </div>
          <div className="grid gap-4">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-center">
              <section className="rounded-[1.75rem] border border-black/8 bg-white/72 px-4 py-3 shadow-sm">
                <div className="flex min-h-[58px] items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-ink">{luminaIdentity.name}</div>
                    <div className="text-[11px] uppercase tracking-[0.16em] text-ink/52">
                      {luminaIdentity.descriptor}
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      className="rounded-full border border-black bg-black px-3 py-1 text-xs font-semibold text-white transition hover:bg-black/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
                      onClick={toggleSpeakingOrder}
                    >
                      {getOrderLabel("lumina")}
                    </button>
                    <div
                      ref={luminaPairMenuRegionRef}
                      className="relative w-[7.5rem]"
                      onKeyDown={(event) => {
                        if (event.key === "Escape") {
                          setPairMenuSide((current) => (current === "lumina" ? null : current));
                        }
                      }}
                    >
                      <button
                        type="button"
                        aria-haspopup="menu"
                        aria-expanded={pairMenuSide === "lumina"}
                        aria-controls={pairMenuSide === "lumina" ? "temperament-pair-menu" : undefined}
                        className="inline-flex w-full justify-center rounded-full bg-ink px-4 py-2 text-base font-semibold leading-none text-paper shadow-sm transition hover:bg-ink/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
                        onClick={() => togglePairMenu("lumina")}
                      >
                        {selectedLuminaLabel}
                      </button>
                      {renderPairMenu("lumina", false)}
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
              <section className="rounded-[1.75rem] border border-black bg-black px-4 py-3 shadow-sm">
                <div className="flex min-h-[58px] items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-white">{vigilaIdentity.name}</div>
                    <div className="text-[11px] uppercase tracking-[0.16em] text-white">
                      {vigilaIdentity.descriptor}
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      className="rounded-full border border-white/16 bg-white px-3 py-1 text-xs font-semibold text-black transition hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
                      onClick={toggleSpeakingOrder}
                    >
                      {getOrderLabel("vigila")}
                    </button>
                    <div
                      ref={vigilaPairMenuRegionRef}
                      className="relative w-[7.5rem]"
                      onKeyDown={(event) => {
                        if (event.key === "Escape") {
                          setPairMenuSide((current) => (current === "vigila" ? null : current));
                        }
                      }}
                    >
                      <button
                        type="button"
                        aria-haspopup="menu"
                        aria-expanded={pairMenuSide === "vigila"}
                        aria-controls={pairMenuSide === "vigila" ? "temperament-pair-menu" : undefined}
                        className="inline-flex w-full justify-center rounded-full bg-white px-4 py-2 text-base font-semibold leading-none text-black shadow-sm transition hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
                        onClick={() => togglePairMenu("vigila")}
                      >
                        {selectedVigilaLabel}
                      </button>
                      {renderPairMenu("vigila", true)}
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
          <label className="space-y-2 text-sm font-medium text-ink/80">
            <span className="block">{uiCopy.model}</span>
            <Select
              value={model}
              onChange={(event) => setModel(event.target.value as BuiltInModel)}
            >
              {BUILT_IN_MODELS.map((builtInModel) => (
                <option key={builtInModel} value={builtInModel}>
                  {builtInModel}
                </option>
              ))}
            </Select>
          </label>
          {submissionError ? (
            <p className="text-sm text-red-700" role="alert">
              {submissionError}
            </p>
          ) : null}
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? uiCopy.startingDebate : uiCopy.startDebate}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export const QuestionForm = memo(QuestionFormImpl);
