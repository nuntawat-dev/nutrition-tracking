import { z } from "zod";

/* ------------------------------------------------------------------ *
 * JSON Schemas sent to the model via output_config.format.
 * Structured outputs do NOT support numeric/string constraints
 * (min/max/minLength), so keep these to types + additionalProperties.
 * ------------------------------------------------------------------ */

export const targetsJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    targetCalories: { type: "number" },
    proteinG: { type: "number" },
    carbG: { type: "number" },
    fatG: { type: "number" },
    rationale: { type: "string" },
  },
  required: ["targetCalories", "proteinG", "carbG", "fatG", "rationale"],
} as const;

export const foodJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          amountG: { type: "number" },
          kcal: { type: "number" },
          proteinG: { type: "number" },
          carbG: { type: "number" },
          fatG: { type: "number" },
          assumptions: { type: "string" },
        },
        required: [
          "name",
          "amountG",
          "kcal",
          "proteinG",
          "carbG",
          "fatG",
          "assumptions",
        ],
      },
    },
    note: { type: "string" },
  },
  required: ["items", "note"],
} as const;

export const exerciseJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    type: { type: "string" },
    whenText: { type: "string" },
    caloriesBurned: { type: "number" },
    note: { type: "string" },
  },
  required: ["type", "whenText", "caloriesBurned", "note"],
} as const;

export const suggestJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    suggestions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          meal: { type: "string" },
          description: { type: "string" },
          estKcal: { type: "number" },
          proteinG: { type: "number" },
          carbG: { type: "number" },
          fatG: { type: "number" },
          why: { type: "string" },
        },
        required: [
          "meal",
          "description",
          "estKcal",
          "proteinG",
          "carbG",
          "fatG",
          "why",
        ],
      },
    },
  },
  required: ["suggestions"],
} as const;

/* ------------------------------------------------------------------ *
 * Zod validators — runtime guard on what the model returns.
 * ------------------------------------------------------------------ */

export const targetsResult = z.object({
  targetCalories: z.number(),
  proteinG: z.number(),
  carbG: z.number(),
  fatG: z.number(),
  rationale: z.string(),
});
export type TargetsResult = z.infer<typeof targetsResult>;

export const foodResult = z.object({
  items: z.array(
    z.object({
      name: z.string(),
      amountG: z.number(),
      kcal: z.number(),
      proteinG: z.number(),
      carbG: z.number(),
      fatG: z.number(),
      assumptions: z.string(),
    }),
  ),
  note: z.string(),
});
export type FoodResult = z.infer<typeof foodResult>;

export const exerciseResult = z.object({
  type: z.string(),
  whenText: z.string(),
  caloriesBurned: z.number(),
  note: z.string(),
});
export type ExerciseResult = z.infer<typeof exerciseResult>;

export const suggestResult = z.object({
  suggestions: z.array(
    z.object({
      meal: z.string(),
      description: z.string(),
      estKcal: z.number(),
      proteinG: z.number(),
      carbG: z.number(),
      fatG: z.number(),
      why: z.string(),
    }),
  ),
});
export type SuggestResult = z.infer<typeof suggestResult>;
