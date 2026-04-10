import type { DebateTurn, Evidence, SessionRecord } from "@/lib/types";
import {
  getLocalizedTemperamentOptionLabel,
  getLocalizedTemperamentPairLabel,
  getOppositeTemperament,
  getTemperamentPairById
} from "@/lib/presets";
import { getLocalizedSideIdentityCopy } from "@/lib/side-identities";

function getEvidenceReferenceLabel(language: SessionRecord["language"]) {
  return language === "zh-CN" ? "证据" : "Evidence";
}

function formatEvidenceContext(evidence: Evidence[], language: SessionRecord["language"]) {
  if (evidence.length === 0) {
    return ["Evidence context: none available"];
  }

  const referenceLabel = getEvidenceReferenceLabel(language);

  return [
    "Evidence context:",
    ...evidence.map((item, index) => {
      const parts = [
        `${referenceLabel} ${index + 1}`,
        `evidenceId=${item.id}`,
        `title=${item.title}`,
        `source=${item.sourceName}`,
        `summary=${item.summary}`
      ];

      if (item.dataPoints?.length) {
        parts.push(`dataPoints=${item.dataPoints.join(" | ")}`);
      }

      return `- ${parts.join(" | ")}`;
    })
  ];
}

function formatTurnContext(turns: DebateTurn[], evidence: Evidence[], language: SessionRecord["language"]) {
  if (turns.length === 0) {
    return ["Debate context: no turns captured yet"];
  }

  const referenceLabel = getEvidenceReferenceLabel(language);
  const evidenceOrder = new Map(evidence.map((item, index) => [item.id, index + 1]));

  return [
    "Debate context:",
    ...turns.map((turn, index) => {
      const referencedEvidenceIds = Array.isArray(turn.referencedEvidenceIds)
        ? turn.referencedEvidenceIds
        : [];
      const citedEvidence =
        referencedEvidenceIds.length > 0
          ? ` | evidenceRefs=${referencedEvidenceIds
              .map((evidenceId) => {
                const order = evidenceOrder.get(evidenceId);
                return order ? `${referenceLabel} ${order}` : evidenceId;
              })
              .join(", ")} | evidenceIds=${referencedEvidenceIds.join(", ")}`
          : "";
      const speaker = typeof turn.speaker === "string" ? turn.speaker : "Unknown speaker";
      const content = typeof turn.content === "string" ? turn.content : "";

      return `- turn ${index + 1} [${turn.id}] ${speaker}: ${content}${citedEvidence}`;
    })
  ];
}

export function buildOpeningPrompt(session: SessionRecord) {
  const language = session.language ?? "en";
  const pair = getTemperamentPairById(session.presetSelection.pairId);
  const lumina = getLocalizedSideIdentityCopy("lumina", language);
  const vigila = getLocalizedSideIdentityCopy("vigila", language);
  const hasPriorTurns = session.turns.length > 0;
  const luminaTemperament = getLocalizedTemperamentOptionLabel(
    session.presetSelection.luminaTemperament,
    language
  );
  const vigilaTemperament = pair
    ? getLocalizedTemperamentOptionLabel(
        getOppositeTemperament(pair, session.presetSelection.luminaTemperament),
        language
      )
    : "";

  return [
    `Language: ${language}`,
    `Question: ${session.question}`,
    `Preset pair: ${pair ? getLocalizedTemperamentPairLabel(pair, language) : session.presetSelection.pairId}`,
    `${lumina.name}: ${luminaTemperament}`,
    `${vigila.name}: ${vigilaTemperament}`,
    `Evidence count: ${session.evidence.length}`,
    ...formatEvidenceContext(session.evidence, language),
    ...formatTurnContext(session.turns, session.evidence, language),
    hasPriorTurns
      ? "Respond directly to the latest turn while advancing your side of the debate."
      : "Write the opening position in the selected language.",
    "Ground the argument in the shared evidence whenever possible.",
    "Prefer concrete facts, data points, and real-world cases over generic claims.",
    `When mentioning evidence in content, use labels like "${getEvidenceReferenceLabel(language)} 1" or the evidence title.`,
    "Never print raw evidence ids in content.",
    "When you rely on evidence, cite the matching evidence ids in referencedEvidenceIds.",
    "Return only valid JSON.",
    'Use this JSON object shape exactly: {"speaker":"<speaker name>","content":"<opening argument>","referencedEvidenceIds":["e1"]}.',
    "If no evidence is cited, return an empty referencedEvidenceIds array."
  ].join("\n");
}

export function buildSummaryPrompt(session: SessionRecord) {
  const language = session.language ?? "en";

  return [
    `Language: ${language}`,
    `Question: ${session.question}`,
    `Turns: ${session.turns?.length ?? 0}`,
    ...formatTurnContext(session.turns ?? [], session.evidence, language),
    ...formatEvidenceContext(session.evidence, language),
    `Write every text field in ${language}.`,
    `When mentioning evidence in text fields, use labels like "${getEvidenceReferenceLabel(language)} 1" or the evidence title.`,
    "Never print raw evidence ids in any text field.",
    "Return a balanced summary with evidence ids.",
    "Return only valid JSON.",
    'Use this JSON object shape exactly: {"strongestFor":[{"text":"<point>","evidenceIds":["e1"]}],"strongestAgainst":[{"text":"<point>","evidenceIds":["e2"]}],"coreDisagreement":"<main disagreement>","keyUncertainty":"<main uncertainty>","nextAction":"<recommended next action>"}.',
    "Use empty arrays when a side has no supported points."
  ].join("\n");
}
