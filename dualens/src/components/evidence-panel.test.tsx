import "@testing-library/jest-dom/vitest";

import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { EvidencePanel } from "@/components/evidence-panel";
import type { Evidence } from "@/lib/types";

const evidence = [
  {
    id: "e1",
    title: "Housing market outlook",
    url: "https://example.com/housing",
    sourceName: "Example News",
    sourceType: "news",
    summary: "Rent remains elevated in the target city.",
    dataPoints: ["Median rent increased 8% year over year."]
  },
  {
    id: "e2",
    title: "Salary guide",
    url: "https://example.com/salary",
    sourceName: "Example Research",
    sourceType: "research",
    summary: "Local salaries improved in the last year.",
    dataPoints: ["Median salary increased 6% year over year."]
  }
] as const;

describe("EvidencePanel", () => {
  it("truncates long source urls in collapsed cards while keeping the full url in expanded details", async () => {
    const user = userEvent.setup();
    const longUrlEvidence = [
      {
        ...evidence[0],
        url: "https://example.com/research/reports/2026/global-housing-affordability-index-with-a-very-long-slug-that-should-not-overflow-the-card?region=asia&city=shanghai"
      }
    ];

    const { container } = render(<EvidencePanel evidence={longUrlEvidence} language="en" />);

    const collapsedUrl = container.querySelector("button p");
    expect(collapsedUrl).toHaveClass("truncate");
    expect(collapsedUrl).toHaveAttribute(
      "title",
      "example.com/research/reports/2026/global-housing-affordability-index-with-a-very-long-slug-that-should-not-overflow-the-card?region=asia&city=shanghai"
    );
    expect(
      screen.queryByRole("link", {
        name:
          "https://example.com/research/reports/2026/global-housing-affordability-index-with-a-very-long-slug-that-should-not-overflow-the-card?region=asia&city=shanghai"
      })
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Housing market outlook/i }));

    expect(
      screen.getByRole("link", {
        name:
          "https://example.com/research/reports/2026/global-housing-affordability-index-with-a-very-long-slug-that-should-not-overflow-the-card?region=asia&city=shanghai"
      })
    ).toBeInTheDocument();
  });

  it("keeps evidence collapsed until selected, then collapses it when clicking elsewhere", async () => {
    const user = userEvent.setup();

    render(<EvidencePanel evidence={[...evidence]} language="en" />);

    expect(screen.getByText("example.com/housing")).toBeInTheDocument();
    expect(screen.queryByText("Rent remains elevated in the target city.")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Housing market outlook/i }));

    expect(screen.getByText("Rent remains elevated in the target city.")).toBeInTheDocument();

    await user.click(document.body);

    expect(screen.queryByText("Rent remains elevated in the target city.")).not.toBeInTheDocument();
  });

  it("opens the clicked evidence card and collapses the previous one", async () => {
    const user = userEvent.setup();

    render(<EvidencePanel evidence={[...evidence]} language="en" />);

    await user.click(screen.getByRole("button", { name: /Housing market outlook/i }));
    expect(screen.getByText("Rent remains elevated in the target city.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Salary guide/i }));

    expect(screen.queryByText("Rent remains elevated in the target city.")).not.toBeInTheDocument();
    expect(screen.getByText("Local salaries improved in the last year.")).toBeInTheDocument();
  });

  it("labels the evidence pool with each side's holder and keeps shared duplicates as one item", () => {
    const sharedDuplicate = {
      id: "e3",
      title: "Talent migration survey",
      url: "https://example.com/migration",
      sourceName: "Example Survey",
      sourceType: "survey",
      summary: "Both sides found the same survey."
    };
    const pooledEvidence = [...evidence, sharedDuplicate];

    render(
      <EvidencePanel
        evidence={pooledEvidence}
        privateEvidence={{
          lumina: [pooledEvidence[0], { ...sharedDuplicate, id: "lumina-copy" }],
          vigila: [pooledEvidence[1], { ...sharedDuplicate, id: "vigila-copy" }]
        }}
        language="zh-CN"
      />
    );

    expect(screen.getByRole("region", { name: "证据池" })).toBeInTheDocument();
    const luminaHolder = screen.getByText("乾明持有");
    const vigilaHolder = screen.getByText("坤察持有");
    const sharedHolder = screen.getByText("共同持有");

    expect(luminaHolder).toHaveClass("bg-paper");
    expect(luminaHolder).toHaveClass("text-ink/60");
    expect(luminaHolder).not.toHaveClass("bg-black");
    expect(luminaHolder).not.toHaveClass("text-white");
    expect(vigilaHolder).toHaveClass("bg-paper");
    expect(sharedHolder).toHaveClass("bg-paper");
    expect(screen.getAllByText("Talent migration survey")).toHaveLength(1);
  });

  it("uploads local files into the evidence pool", async () => {
    const user = userEvent.setup();

    function UploadHarness() {
      const [items, setItems] = useState<Evidence[]>([]);

      return (
        <EvidencePanel
          evidence={items}
          language="zh-CN"
          onUploadEvidence={(nextItems) =>
            setItems((current) => [...current, ...nextItems])
          }
        />
      );
    }

    render(<UploadHarness />);

    await user.upload(
      screen.getByLabelText("上传本地证据"),
      new File(["本地证据内容说明"], "local-note.txt", { type: "text/plain" })
    );

    expect(await screen.findByText("local-note.txt")).toBeInTheDocument();
    expect(screen.getByText("本地")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /local-note.txt/ }));

    expect(screen.getByText("本地证据内容说明")).toBeInTheDocument();
  });
});
