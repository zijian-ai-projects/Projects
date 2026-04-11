import type {
  TemperamentOption,
  TemperamentPair,
  TemperamentPairId,
  SessionConfigDefaults,
  UiLanguage
} from "@/lib/types";

const TEMPERAMENT_OPTION_LABELS: Record<
  UiLanguage,
  Record<TemperamentOption, string>
> = {
  en: {
    cautious: "Cautious",
    aggressive: "Aggressive",
    rational: "Rational",
    intuitive: "Intuitive",
    "cost-focused": "Cost-focused",
    "benefit-focused": "Benefit-focused",
    "short-term": "Short-term",
    "long-term": "Long-term"
  },
  "zh-CN": {
    cautious: "谨慎",
    aggressive: "激进",
    rational: "理性",
    intuitive: "直觉",
    "cost-focused": "成本",
    "benefit-focused": "收益",
    "short-term": "短期",
    "long-term": "长期"
  }
};

export const TEMPERAMENT_PAIRS = [
  {
    id: "cautious-aggressive",
    labels: {
      en: "Cautious / Aggressive",
      "zh-CN": "谨慎 / 激进"
    },
    options: ["cautious", "aggressive"]
  },
  {
    id: "rational-intuitive",
    labels: {
      en: "Rational / Intuitive",
      "zh-CN": "理性 / 直觉"
    },
    options: ["rational", "intuitive"]
  },
  {
    id: "cost-benefit",
    labels: {
      en: "Cost-focused / Benefit-focused",
      "zh-CN": "成本 / 收益"
    },
    options: ["cost-focused", "benefit-focused"]
  },
  {
    id: "short-long",
    labels: {
      en: "Short-term / Long-term",
      "zh-CN": "短期 / 长期"
    },
    options: ["short-term", "long-term"]
  }
] as const satisfies readonly TemperamentPair[];

export function getTemperamentPairById(id: TemperamentPairId | string) {
  return TEMPERAMENT_PAIRS.find((pair) => pair.id === id);
}

export function getOppositeTemperament(
  pair: TemperamentPair,
  temperament: TemperamentOption
) {
  if (!pair.options.includes(temperament)) {
    throw new Error(
      `Invalid temperament "${temperament}" for pair "${pair.id}"`
    );
  }

  return pair.options[0] === temperament ? pair.options[1] : pair.options[0];
}

export function getLocalizedTemperamentOptionLabel(
  temperament: TemperamentOption,
  language: UiLanguage
) {
  return TEMPERAMENT_OPTION_LABELS[language][temperament];
}

export function getLocalizedTemperamentPairLabel(
  pair: TemperamentPair,
  language: UiLanguage
) {
  return pair.labels[language] ?? pair.labels.en;
}

export const DEFAULT_SESSION_CONFIG: SessionConfigDefaults = {
  debateMode: "shared-evidence",
  sourceStrategy: "credible-first",
  searchDepth: "standard",
  roundCount: 3,
  summaryStyle: "balanced"
};
