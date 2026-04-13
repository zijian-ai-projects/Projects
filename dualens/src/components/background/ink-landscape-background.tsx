import { generateShanShuiStrip, type ShanShuiVariant } from "@/components/background/shan-shui-inf-adapted";

type InkLandscapeBackgroundVariant = ShanShuiVariant;

export function InkLandscapeBackground({
  variant = "home"
}: {
  variant?: InkLandscapeBackgroundVariant;
}) {
  const strip = generateShanShuiStrip({ variant });
  const isWorkspace = variant === "workspace";
  const stripId = `shan-shui-inf-strip-${variant}`;

  return (
    <div
      aria-hidden="true"
      data-testid="ink-landscape-background"
      data-variant={variant}
      className={[
        "ink-landscape pointer-events-none fixed inset-0 z-0 overflow-hidden",
        isWorkspace ? "ink-landscape--workspace" : "ink-landscape--home"
      ].join(" ")}
    >
      <div data-ink-layer="paper" className="ink-landscape__paper" />
      <div data-ink-layer="scroll-track" className="ink-landscape__scroll-track shan-shui-scroll">
        <svg
          aria-hidden="true"
          className="ink-landscape__strip"
          fill="none"
          preserveAspectRatio="none"
          viewBox={`0 0 ${strip.width * 2} ${strip.height}`}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <g id={stripId} dangerouslySetInnerHTML={{ __html: strip.svg }} />
          </defs>
          <use data-shan-shui-strip={variant} href={`#${stripId}`} />
          <use data-shan-shui-strip={variant} href={`#${stripId}`} x={strip.width} />
        </svg>
      </div>
      <div data-ink-layer="reading-reserve" className="ink-landscape__reading-reserve" />
      <div data-ink-layer="preview-reserve" className="ink-landscape__preview-reserve" />
      <div data-ink-layer="workspace-veil" className="ink-landscape__workspace-veil" />
      <div data-ink-layer="workspace-quiet-zone" className="ink-landscape__workspace-quiet-zone" />
    </div>
  );
}
