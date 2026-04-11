import Link from "next/link";

function TaijiMark() {
  return (
    <svg
      aria-hidden="true"
      className="h-24 w-24 shrink-0 animate-taiji-counterclockwise text-black/90"
      fill="none"
      viewBox="0 0 120 120"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="60" cy="60" r="58" className="stroke-current" strokeWidth="1.5" />
      <path
        className="fill-current"
        d="M60 2a58 58 0 0 1 0 116a29 29 0 0 0 0-58a29 29 0 0 1 0-58Z"
      />
      <circle cx="60" cy="31" r="10" className="fill-white" />
      <circle cx="60" cy="89" r="10" className="fill-current" />
    </svg>
  );
}

function InkMark() {
  return (
    <div
      data-testid="product-ink-mark"
      className="relative h-full min-h-[18rem] overflow-hidden rounded-[28px] border border-black/8 bg-white/80 p-6 shadow-[0_10px_28px_rgba(0,0,0,0.03)]"
    >
      <div className="absolute left-5 top-5 h-28 w-28 rounded-full border border-black/6" />
      <svg
        aria-hidden="true"
        className="absolute right-4 top-6 h-28 w-28 animate-taiji-counterclockwise text-black/[0.08]"
        fill="none"
        viewBox="0 0 120 120"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="60" cy="60" r="56" className="stroke-current" strokeWidth="1.25" />
        <path className="fill-current" d="M60 4a56 56 0 0 1 0 112a28 28 0 0 0 0-56a28 28 0 0 1 0-56Z" />
        <circle cx="60" cy="32" r="9" className="fill-white" />
        <circle cx="60" cy="88" r="9" className="fill-current" />
      </svg>
      <svg
        aria-hidden="true"
        className="absolute inset-x-6 bottom-8 h-32 w-[calc(100%-3rem)] text-black/[0.08]"
        fill="none"
        viewBox="0 0 280 120"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M18 78c20-16 40-22 66-15s40 12 64 1 47-13 116 3"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="12"
        />
        <path
          d="M46 34c18 7 29 16 41 29"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="6"
        />
      </svg>
      <div className="absolute bottom-6 left-6 right-6 space-y-2">
        <p className="text-xs uppercase tracking-[0.18em] text-black/42">Taiji / Ink</p>
        <p className="text-sm leading-6 text-black/64">静观、并置、留白，让证据先说话。</p>
      </div>
    </div>
  );
}

export default function ProductPage() {
  return (
    <div className="space-y-8 px-6 py-8 lg:px-10 lg:py-10">
      <header className="flex flex-col gap-6 border-b border-black/8 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl space-y-4">
          <div className="flex items-center gap-4">
            <TaijiMark />
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.22em] text-black/42">Product</p>
              <h1 className="text-3xl font-semibold tracking-[-0.05em] text-[#161616] lg:text-[2.5rem]">
                两仪决
              </h1>
            </div>
          </div>
          <p className="max-w-2xl text-sm leading-7 text-black/64">
            共证衡辩，隔证三辩。
            把同一问题放到正反两面，让证据、立场与判断在同一个界面里对齐。
          </p>
        </div>
        <Link
          href="/debate"
          className="inline-flex h-11 items-center justify-center rounded-[8px] border border-black/12 bg-black px-4 text-sm font-medium text-white transition hover:bg-black/90"
        >
          进入辩论
        </Link>
      </header>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <div
          data-testid="product-intro"
          className="space-y-4 rounded-[28px] border border-black/8 bg-white/80 p-6 shadow-[0_10px_28px_rgba(0,0,0,0.03)]"
        >
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.18em] text-black/42">共证衡辩</p>
            <p className="text-sm leading-7 text-black/70">
              把同题证据摆在一处，让观点与证据同步出现，先看见共同的边界，再判断分歧的走向。
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.18em] text-black/42">隔证三辩</p>
            <p className="text-sm leading-7 text-black/70">
              让正反双方各自沿着证据、推理和结论展开辩论，保留对照、递进和回看的空间。
            </p>
          </div>
          <div className="rounded-[22px] border border-black/8 bg-black/[0.02] px-4 py-4">
            <p className="text-sm leading-7 text-black/68">
              一次进入辩论，一次对齐视角，一次留下可回看的记录。
            </p>
          </div>
        </div>

        <InkMark />
      </section>
    </div>
  );
}
