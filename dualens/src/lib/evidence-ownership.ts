import type { Evidence, PrivateEvidencePools, SpeakerSideKey } from "@/lib/types";

export type EvidenceHolder = SpeakerSideKey | "both" | null;

const SIDES: SpeakerSideKey[] = ["lumina", "vigila"];

function isSameEvidence(left: Evidence, right: Evidence) {
  return left.id === right.id || left.url === right.url;
}

export function getEvidenceHolder(
  evidence: Evidence,
  privateEvidence?: PrivateEvidencePools
): EvidenceHolder {
  if (!privateEvidence) {
    return null;
  }

  const holdingSides = SIDES.filter((side) =>
    privateEvidence[side]?.some((item) => isSameEvidence(item, evidence))
  );

  if (holdingSides.length > 1) {
    return "both";
  }

  return holdingSides[0] ?? null;
}
