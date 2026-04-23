import { z } from "zod";
import { TEMPERAMENT_PAIRS } from "@/lib/presets";
import {
  isAllowedProviderBaseUrl,
  isAllowedSearchEndpoint
} from "@/lib/url-safety";
import type {
  DebateMode,
  DebatePresetSelection,
  TemperamentPairId
} from "@/lib/types";

const MAX_SESSION_ROUND_COUNT = 5;
const TEMPERAMENT_PAIR_IDS = TEMPERAMENT_PAIRS.map(
  (pair) => pair.id
) as [TemperamentPairId, ...TemperamentPairId[]];

const MIN_CHINESE_QUESTION_LENGTH = 5;
const MIN_ENGLISH_QUESTION_LENGTH = 10;
const trimmedStringSchema = z.string().trim();
const trimmedOptionalStringSchema = z.string().trim().min(1).optional();
const modelSchema = trimmedStringSchema.min(1);
const debateModeSchema = z.enum(["shared-evidence", "private-evidence"]);
const providerConfigSchema = z.object({
  baseUrl: trimmedStringSchema.min(1).url().refine(isAllowedProviderBaseUrl, {
    message: "Provider base URL is not allowed"
  }),
  apiKey: trimmedStringSchema.min(1),
  model: trimmedStringSchema.min(1)
}).strict();
const searchConfigSchema = z
  .object({
    engineId: z.enum(["bing", "baidu", "google", "tavily"]),
    apiKey: trimmedStringSchema.min(1),
    endpoint: trimmedStringSchema.min(1).url(),
    engineIdentifier: trimmedStringSchema.min(1).optional(),
    extra: trimmedStringSchema.min(1).optional()
  })
  .strict()
  .superRefine((config, ctx) => {
    if (!isAllowedSearchEndpoint(config.engineId, config.endpoint)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Search endpoint is not allowed",
        path: ["endpoint"]
      });
    }
  });
const sessionConfigSchema = z.object({
  debateMode: debateModeSchema.optional(),
  sourceStrategy: z.enum(["credible-first", "full-web"]).optional(),
  searchDepth: z.enum(["quick", "standard", "deep"]).optional(),
  roundCount: z.number().int().positive().max(MAX_SESSION_ROUND_COUNT).optional(),
  summaryStyle: z.enum(["balanced", "concise", "actionable"]).optional()
}).strict();

const presetSelectionSchema = z
  .object({
    pairId: z.enum(TEMPERAMENT_PAIR_IDS),
    luminaTemperament: z.string().trim().min(1)
  })
  .superRefine((selection, ctx) => {
    const pair = TEMPERAMENT_PAIRS.find((item) => item.id === selection.pairId);
    if (!pair) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Unknown temperament pair"
      });
      return;
    }

    if (!(pair.options as readonly string[]).includes(selection.luminaTemperament)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Selected temperament does not belong to the selected pair",
        path: ["luminaTemperament"]
      });
    }
  })
  .transform((selection) => selection as DebatePresetSelection);

export const createSessionInputSchema = z
  .object({
    question: trimmedStringSchema.min(1),
    presetSelection: presetSelectionSchema,
    firstSpeaker: z.enum(["lumina", "vigila"]).default("lumina"),
    language: z.enum(["zh-CN", "en"]).default("zh-CN"),
    premise: trimmedOptionalStringSchema,
    debateMode: debateModeSchema.optional().transform((value) => value as DebateMode | undefined),
    model: modelSchema,
    providerConfig: providerConfigSchema.optional(),
    searchConfig: searchConfigSchema.optional(),
    config: sessionConfigSchema.optional()
  })
  .strict()
  .superRefine((input, ctx) => {
    const minimumQuestionLength =
      input.language === "en" ? MIN_ENGLISH_QUESTION_LENGTH : MIN_CHINESE_QUESTION_LENGTH;

    if (input.question.length < minimumQuestionLength) {
      ctx.addIssue({
        code: z.ZodIssueCode.too_small,
        minimum: minimumQuestionLength,
        type: "string",
        inclusive: true,
        path: ["question"],
        message: `Question must contain at least ${minimumQuestionLength} characters`
      });
    }
  });
