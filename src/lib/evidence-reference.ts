import type { Evidence } from "@/lib/types";

export function buildEvidenceOrderMap(evidence: Evidence[]) {
  return new Map(evidence.map((item, index) => [item.id, index + 1]));
}

export function buildEvidenceMap(evidence: Evidence[]) {
  return new Map(evidence.map((item) => [item.id, item]));
}

export function formatEvidenceSourceUrl(url: string) {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname === "/" ? "" : parsed.pathname.replace(/\/$/, "");
    return `${parsed.hostname}${path}${parsed.search}`;
  } catch {
    return url.replace(/^https?:\/\//i, "");
  }
}

export function formatEvidenceReference(
  evidenceId: string,
  evidenceOrder: Map<string, number>,
  referenceLabel: string
) {
  const order = evidenceOrder.get(evidenceId);
  return order ? `${referenceLabel} ${order}` : referenceLabel;
}

export function replaceEvidenceIdsInText(
  text: string,
  evidenceOrder: Map<string, number>,
  referenceLabel: string
) {
  let nextText = text;

  for (const [evidenceId, order] of evidenceOrder.entries()) {
    nextText = nextText.replaceAll(evidenceId, `${referenceLabel} ${order}`);
  }

  return nextText;
}
