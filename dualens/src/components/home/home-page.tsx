"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { InkLandscapeBackground } from "@/components/background/ink-landscape-background";
import { HomePreview } from "@/components/home/home-preview";
import { TopbarActions } from "@/components/topbar/topbar-actions";
import { useAppPreferences } from "@/lib/app-preferences";
import type { UiLanguage } from "@/lib/types";
import { getSiteCopy } from "@/locales/site-copy";

function TaijiMark({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={`${className} shrink-0 animate-taiji-counterclockwise text-app-strong`}
      fill="none"
      viewBox="0 0 120 120"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="60" cy="60" r="58" className="fill-app-card stroke-current" strokeWidth="1.5" />
      <path className="fill-current" d="M60 2a58 58 0 0 1 0 116a29 29 0 0 0 0-58a29 29 0 0 1 0-58Z" />
      <circle cx="60" cy="31" r="10" className="fill-app-card" />
      <circle cx="60" cy="89" r="10" className="fill-current" />
    </svg>
  );
}

export function HomePage({ initialLanguage }: { initialLanguage?: UiLanguage }) {
  const { language, setLanguage } = useAppPreferences();
  const [useInitialLanguage, setUseInitialLanguage] = useState(Boolean(initialLanguage));

  useEffect(() => {
    if (initialLanguage) {
      setLanguage(initialLanguage);
      setUseInitialLanguage(false);
    }
  }, [initialLanguage, setLanguage]);

  const copy = getSiteCopy(useInitialLanguage && initialLanguage ? initialLanguage : language);

  return (
    <main className="relative min-h-screen overflow-hidden bg-app text-app-foreground">
      <InkLandscapeBackground variant="home" />
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1480px] flex-col px-5 py-5 sm:px-6 lg:px-10">
        <header className="flex flex-col gap-4 rounded-[28px] border border-app-line bg-app-panel/72 px-4 py-4 shadow-app-soft backdrop-blur md:flex-row md:items-center md:justify-between">
          <Link
            href="/"
            aria-label={copy.brand}
            className="group flex w-fit items-center gap-3 rounded-[8px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus"
          >
            <TaijiMark />
            <div>
              <h1 className="text-xl font-semibold tracking-[-0.05em] text-app-strong">{copy.brand}</h1>
              <p className="text-xs uppercase tracking-[0.18em] text-app-muted">{copy.brandRoman}</p>
            </div>
          </Link>
          <TopbarActions showStartButton className="md:flex-nowrap" />
        </header>

        <section className="grid min-h-[calc(100vh-7rem)] gap-10 py-16 lg:grid-cols-[minmax(0,0.95fr)_minmax(24rem,0.8fr)] lg:items-center lg:py-20">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-[8px] border border-app-line bg-app-panel/78 px-3 py-2 text-xs uppercase tracking-[0.18em] text-app-muted shadow-app-soft backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-app-strong" />
              {copy.hero.eyebrow}
            </div>
            <div className="space-y-5">
              <h2 className="max-w-4xl text-4xl font-semibold leading-[1.05] tracking-[-0.06em] text-app-strong sm:text-5xl lg:text-7xl">
                {copy.hero.title}
              </h2>
              <p className="max-w-2xl text-base leading-8 text-app-muted sm:text-lg">
                {copy.hero.lead}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/app"
                className="inline-flex h-12 items-center justify-center rounded-[8px] border border-app-strong bg-app-strong px-5 text-sm font-medium text-app-inverse transition hover:bg-app-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus"
              >
                {copy.hero.primaryCta}
              </Link>
              <a
                href="#flow"
                className="inline-flex h-12 items-center justify-center rounded-[8px] border border-app-line bg-app-panel px-5 text-sm font-medium text-app-strong transition hover:bg-app-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus"
              >
                {copy.hero.secondaryCta}
              </a>
            </div>
          </div>

          <HomePreview copy={copy} />
        </section>

        <section className="grid gap-6 border-y border-app-line py-14 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.2em] text-app-muted">{copy.value.eyebrow}</p>
            <h2 className="max-w-2xl text-3xl font-semibold tracking-[-0.05em] text-app-strong lg:text-5xl">
              {copy.value.title}
            </h2>
            <p className="max-w-xl text-sm leading-7 text-app-muted">{copy.value.body}</p>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {copy.value.items.map((item) => (
              <article key={item.title} className="rounded-[20px] border border-app-line bg-app-card/82 p-5 shadow-app-soft backdrop-blur">
                <h3 className="text-lg font-semibold text-app-strong">{item.title}</h3>
                <p className="mt-4 text-sm leading-7 text-app-muted">{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="flow" className="py-14">
          <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-app-muted">{copy.flow.eyebrow}</p>
              <h2 className="mt-3 max-w-3xl text-3xl font-semibold tracking-[-0.05em] text-app-strong lg:text-5xl">
                {copy.flow.title}
              </h2>
            </div>
            <TaijiMark className="h-16 w-16 opacity-70" />
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {copy.flow.steps.map((step, index) => (
              <article key={step.title} className="min-h-[13rem] rounded-[20px] border border-app-line bg-app-card/84 p-5 shadow-app-soft backdrop-blur">
                <p className="text-xs uppercase tracking-[0.18em] text-app-muted">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-7 text-xl font-semibold tracking-[-0.03em] text-app-strong">{step.title}</h3>
                <p className="mt-4 text-sm leading-7 text-app-muted">{step.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-6 py-14 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.2em] text-app-muted">{copy.features.eyebrow}</p>
            <h2 className="text-3xl font-semibold tracking-[-0.05em] text-app-strong lg:text-5xl">
              {copy.features.title}
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {copy.features.items.map((feature) => (
              <article key={feature.title} className="rounded-[20px] border border-app-line bg-app-panel/82 p-5 shadow-app-soft backdrop-blur">
                <h3 className="text-lg font-semibold text-app-strong">{feature.title}</h3>
                <p className="mt-3 text-sm leading-7 text-app-muted">{feature.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-6 rounded-[28px] border border-app-line bg-app-card/82 p-6 shadow-app-soft backdrop-blur lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)] lg:p-8">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-app-muted">{copy.scenarios.eyebrow}</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-app-strong lg:text-5xl">
              {copy.scenarios.title}
            </h2>
          </div>
          <div className="grid auto-rows-fr gap-3 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(10rem,1fr))]">
            {copy.scenarios.items.map((scenario) => (
              <div key={scenario} className="flex min-h-[5.75rem] items-center justify-center rounded-[20px] border border-app-line bg-app-soft p-4 text-center text-sm font-medium leading-6 text-app-strong">
                {scenario}
              </div>
            ))}
          </div>
        </section>

        <section className="py-16">
          <div className="rounded-[28px] border border-app-strong bg-app-strong p-6 text-app-inverse shadow-[0_28px_90px_var(--shadow-strong)] lg:p-10">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <div className="space-y-4">
                <p className="text-sm uppercase tracking-[0.2em] text-app-inverse/60">{copy.brandRoman}</p>
                <h2 className="max-w-3xl text-3xl font-semibold tracking-[-0.05em] lg:text-5xl">
                  {copy.cta.title}
                </h2>
                <p className="max-w-2xl text-sm leading-7 text-app-inverse/70">{copy.cta.body}</p>
              </div>
              <Link
                href="/app"
                className="inline-flex h-12 w-fit items-center justify-center rounded-[8px] border border-app-inverse/22 bg-app-inverse px-5 text-sm font-medium text-app-strong transition hover:bg-app-inverse/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-inverse/40"
              >
                {copy.cta.action}
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
