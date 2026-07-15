export type Sex = "male" | "female";
export type Goal = "cut" | "maintain" | "bulk";
export type Activity =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very_active";

export interface Profile {
  tdee: number | null;
  goal: Goal;
  weightKg: number | null;
  heightCm: number | null;
  age: number | null;
  sex: Sex | null;
  activity: Activity;
  preferences: string;
  targetCalories: number | null;
  proteinG: number | null;
  carbG: number | null;
  fatG: number | null;
  rationale: string | null;
  addExerciseBack: boolean;
  updatedAt: string | null;
}

export interface FoodItem {
  id: number;
  name: string;
  amountG: number | null;
  kcal: number;
  proteinG: number;
  carbG: number;
  fatG: number;
}

export interface FoodEntry {
  id: number;
  date: string;
  createdAt: string;
  source: "photo" | "text";
  rawInput: string | null;
  note: string | null;
  items: FoodItem[];
}

export interface ExerciseEntry {
  id: number;
  date: string;
  createdAt: string;
  type: string;
  whenText: string | null;
  caloriesBurned: number;
  note: string | null;
}

export interface FoodFavorite {
  id: number;
  name: string;
  amountG: number | null;
  kcal: number;
  proteinG: number;
  carbG: number;
  fatG: number;
  createdAt: string;
}

export interface ExerciseFavorite {
  id: number;
  type: string;
  caloriesBurned: number;
  createdAt: string;
}

export interface Macros {
  kcal: number;
  protein: number;
  carb: number;
  fat: number;
}

export interface DayState {
  date: string;
  profile: Profile;
  foodEntries: FoodEntry[];
  exercise: ExerciseEntry[];
  consumed: Macros;
  exerciseBurned: number;
  targets: Macros;
  remaining: Macros;
}
