import { z } from "zod";
import { TEMPERAMENT_PAIRS } from "@/lib/presets";
import type {
  DebatePresetSelection,
  TemperamentPairId
} from "@/lib/types";

const TEMPERAMENT_PAIR_IDS = TEMPERAMENT_PAIRS.map(
  (pair) => pair.id
) as [TemperamentPairId, ...TemperamentPairId[]];

const trimmedStringSchema = z.string().trim();
const trimmedOptionalStringSchema = z.string().trim().min(1).optional();
const builtInModelSchema = z.enum(["deepseek-chat", "deepseek-reasoner"]);
const sessionConfigSchema = z.object({
  sourceStrategy: z.enum(["credible-first", "full-web"]).optional(),
  searchDepth: z.enum(["quick", "standard", "deep"]).optional(),
  roundCount: z.number().int().positive().optional(),
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
    question: trimmedStringSchema.min(10),
    presetSelection: presetSelectionSchema,
    firstSpeaker: z.enum(["lumina", "vigila"]).default("lumina"),
    language: z.enum(["zh-CN", "en"]).default("zh-CN"),
    premise: trimmedOptionalStringSchema,
    model: builtInModelSchema,
    config: sessionConfigSchema.optional()
  })
  .strict();
