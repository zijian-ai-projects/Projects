import type { HomeCopy } from "@/locales/types";

export function HomePreview({ copy }: { copy: HomeCopy }) {
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-app-line bg-app-card/88 p-4 shadow-[0_24px_80px_var(--shadow-soft)] backdrop-blur">
      <div className="flex items-center justify-between gap-3 border-b border-app-line pb-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-app-muted">{copy.hero.previewLabel}</p>
          <p className="mt-2 max-w-lg text-sm font-medium leading-6 text-app-strong">
            {copy.hero.previewQuestion}
          </p>
        </div>
        <div className="hidden h-10 w-10 shrink-0 rounded-full border border-app-line bg-app-soft md:block" />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <article className="min-h-[12rem] rounded-[20px] border border-app-line bg-app-panel p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold tracking-[-0.03em] text-app-strong">
              {copy.hero.previewLeftTitle}
            </h3>
            <span className="rounded-[8px] border border-app-line bg-app-soft px-2.5 py-1 text-xs text-app-muted">
              Yang
            </span>
          </div>
          <p className="mt-5 text-sm leading-7 text-app-muted">{copy.hero.previewLeftBody}</p>
        </article>

        <article className="min-h-[12rem] rounded-[20px] border border-app-strong bg-app-strong p-4 text-app-inverse">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold tracking-[-0.03em]">
              {copy.hero.previewRightTitle}
            </h3>
            <span className="rounded-[8px] border border-app-inverse/22 bg-app-inverse/8 px-2.5 py-1 text-xs text-app-inverse/68">
              Yin
            </span>
          </div>
          <p className="mt-5 text-sm leading-7 text-app-inverse/72">{copy.hero.previewRightBody}</p>
        </article>
      </div>

      <div className="mt-3 rounded-[20px] border border-app-line bg-app-soft px-4 py-3 text-sm leading-6 text-app-muted">
        {copy.hero.previewEvidence}
      </div>
    </div>
  );
}
