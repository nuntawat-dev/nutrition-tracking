import type { Macros, Profile } from "./types";

export const targetsSystem = `You are a registered sports nutritionist. Given a person's stats and goal, compute a sensible daily calorie target and a macronutrient split (protein, carbohydrate, and fat in grams).

Rules:
- Treat the person's stated TDEE as their maintenance calories.
- goal "cut": subtract roughly 15-20% (about 300-500 kcal) from TDEE.
- goal "bulk": add roughly 10-15% (about 200-400 kcal) to TDEE.
- goal "maintain": keep target calories at TDEE.
- Protein: about 1.6-2.2 g per kg of bodyweight (use the higher end when cutting).
- Fat: about 0.6-1.0 g per kg of bodyweight, and never below ~20% of total calories.
- Carbohydrate: fill the remaining calories.
- Ensure 4*protein + 4*carb + 9*fat is within ~40 kcal of targetCalories.
- Respect any dietary preferences or restrictions provided.
- Return whole-number grams and a single concise sentence for "rationale".`;

export function targetsUser(input: {
  tdee: number;
  goal: string;
  weightKg: number | null;
  heightCm: number | null;
  age: number | null;
  sex: string | null;
  activity: string;
  preferences: string;
}): string {
  return [
    `Compute daily targets for this person:`,
    `- TDEE (maintenance calories): ${input.tdee} kcal`,
    `- Goal: ${input.goal}`,
    `- Bodyweight: ${input.weightKg ?? "unknown"} kg`,
    `- Height: ${input.heightCm ?? "unknown"} cm`,
    `- Age: ${input.age ?? "unknown"}`,
    `- Sex: ${input.sex ?? "unknown"}`,
    `- Activity level: ${input.activity}`,
    `- Dietary preferences / restrictions: ${
      input.preferences.trim() || "none stated"
    }`,
  ].join("\n");
}

export const foodSystem = `You are a nutrition-analysis assistant. You receive a photo of food and/or a text description (which may include weights) and must return the nutrition breakdown.

Rules:
- Identify each distinct food or drink item. Prefer separate items over lumping a meal into one.
- For each item, give its amount in grams. If the input states a weight, use it. Otherwise estimate a typical portion and note that in "assumptions".
- Estimate calories, protein, carbohydrate, and fat per item using standard food-composition data.
- Round grams and kcal to whole numbers; macros to one decimal place.
- "note" holds any overall caveat about the estimate (or an empty string).
- If you truly cannot identify any food, return an empty "items" array and explain in "note".`;

export function foodUser(text: string | null, hasImage: boolean): string {
  const parts: string[] = [];
  if (hasImage) parts.push("A photo of the food is attached.");
  if (text && text.trim()) {
    parts.push(`Description from the user: ${text.trim()}`);
  } else if (!hasImage) {
    parts.push("No description or photo was provided.");
  }
  parts.push("Return the nutrition breakdown for everything shown/described.");
  return parts.join("\n");
}

export const exerciseSystem = `You parse a short free-text description of ONE exercise session into structured data.

Rules:
- "type": the name/type of exercise (e.g. "running", "weight training").
- "whenText": when it happened, copied in the user's own words (e.g. "this morning"); empty string if not stated.
- "caloriesBurned": if the user states a number of calories, use it exactly. Otherwise estimate from the activity, duration, and intensity, using bodyweight if provided.
- "note": any assumptions you made (or empty string).`;

export function exerciseUser(text: string, weightKg: number | null): string {
  return [
    `Exercise description: ${text.trim()}`,
    `Person's bodyweight: ${weightKg ?? "unknown"} kg`,
  ].join("\n");
}

export const suggestSystem = `You are a friendly nutrition coach. Suggest the user's NEXT meal (or snack) so they can land near their remaining daily targets.

Rules:
- Propose 1-3 concrete, realistic, easy-to-make options.
- Each option's combined macros should roughly fit the remaining budget, prioritising protein and calories.
- If very little budget remains, suggest something small; if calories are already exceeded, suggest a light, high-protein low-calorie option and say so.
- Respect dietary preferences.
- For each option give estimated kcal and macros and a one-line reason ("why").`;

export function suggestUser(input: {
  remaining: Macros;
  targets: Macros;
  consumed: Macros;
  preferences: string;
  localTime: string;
}): string {
  return [
    `Current time for the user: ${input.localTime}`,
    `Daily targets — ${input.targets.kcal} kcal, ${input.targets.protein} g protein, ${input.targets.carb} g carbs, ${input.targets.fat} g fat.`,
    `Consumed so far — ${input.consumed.kcal} kcal, ${input.consumed.protein} g protein, ${input.consumed.carb} g carbs, ${input.consumed.fat} g fat.`,
    `Remaining for the day — ${input.remaining.kcal} kcal, ${input.remaining.protein} g protein, ${input.remaining.carb} g carbs, ${input.remaining.fat} g fat.`,
    `Dietary preferences / restrictions: ${
      input.preferences.trim() || "none stated"
    }.`,
    `Suggest the next meal.`,
  ].join("\n");
}

export function profilePreferences(p: Profile): string {
  return p.preferences ?? "";
}
