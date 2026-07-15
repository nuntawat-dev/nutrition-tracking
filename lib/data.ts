import { db, ensureSchema } from "./db";
import type {
  Activity,
  DayState,
  ExerciseEntry,
  ExerciseFavorite,
  FoodEntry,
  FoodFavorite,
  FoodItem,
  Goal,
  Macros,
  Profile,
  Sex,
} from "./types";

/* ---------- value coercion helpers ---------- */
const num = (v: unknown): number | null =>
  v === null || v === undefined ? null : Number(v);
const n0 = (v: unknown): number =>
  v === null || v === undefined ? 0 : Number(v);
const str = (v: unknown): string | null =>
  v === null || v === undefined ? null : String(v);
const round = (v: number, dp = 0): number => {
  const f = 10 ** dp;
  return Math.round(v * f) / f;
};

/* ---------- profile ---------- */

type ProfileRow = Record<string, unknown>;

function mapProfile(r: ProfileRow): Profile {
  return {
    tdee: num(r.tdee),
    goal: (str(r.goal) as Goal) ?? "maintain",
    weightKg: num(r.weight_kg),
    heightCm: num(r.height_cm),
    age: num(r.age),
    sex: str(r.sex) as Sex | null,
    activity: (str(r.activity) as Activity) ?? "moderate",
    preferences: str(r.preferences) ?? "",
    targetCalories: num(r.target_calories),
    proteinG: num(r.protein_g),
    carbG: num(r.carb_g),
    fatG: num(r.fat_g),
    rationale: str(r.rationale),
    addExerciseBack: n0(r.add_exercise_back) === 1,
    updatedAt: str(r.updated_at),
  };
}

export async function getProfile(): Promise<Profile> {
  await ensureSchema();
  const rs = await db().execute("SELECT * FROM profile WHERE id = 1");
  return mapProfile(rs.rows[0] as ProfileRow);
}

const PROFILE_COLUMNS: Record<string, string> = {
  tdee: "tdee",
  goal: "goal",
  weightKg: "weight_kg",
  heightCm: "height_cm",
  age: "age",
  sex: "sex",
  activity: "activity",
  preferences: "preferences",
  targetCalories: "target_calories",
  proteinG: "protein_g",
  carbG: "carb_g",
  fatG: "fat_g",
  rationale: "rationale",
  addExerciseBack: "add_exercise_back",
};

export type ProfilePatch = Partial<
  Pick<
    Profile,
    | "tdee"
    | "goal"
    | "weightKg"
    | "heightCm"
    | "age"
    | "sex"
    | "activity"
    | "preferences"
    | "targetCalories"
    | "proteinG"
    | "carbG"
    | "fatG"
    | "rationale"
    | "addExerciseBack"
  >
>;

export async function updateProfile(patch: ProfilePatch): Promise<Profile> {
  await ensureSchema();
  const sets: string[] = [];
  const args: (string | number | null)[] = [];
  for (const [key, col] of Object.entries(PROFILE_COLUMNS)) {
    if (key in patch) {
      let v = (patch as Record<string, unknown>)[key];
      if (key === "addExerciseBack") v = v ? 1 : 0;
      sets.push(`${col} = ?`);
      args.push((v as string | number | null) ?? null);
    }
  }
  sets.push("updated_at = ?");
  args.push(new Date().toISOString());
  await db().execute({
    sql: `UPDATE profile SET ${sets.join(", ")} WHERE id = 1`,
    args,
  });
  return getProfile();
}

/* ---------- food ---------- */

export interface NewFoodItem {
  name: string;
  amountG: number | null;
  kcal: number;
  proteinG: number;
  carbG: number;
  fatG: number;
}

export async function addFoodEntry(input: {
  date: string;
  source: "photo" | "text";
  rawInput: string | null;
  note: string | null;
  items: NewFoodItem[];
}): Promise<void> {
  await ensureSchema();
  const c = db();
  const now = new Date().toISOString();
  const res = await c.execute({
    sql: `INSERT INTO food_entries (date, created_at, source, raw_input, note)
          VALUES (?, ?, ?, ?, ?)`,
    args: [input.date, now, input.source, input.rawInput, input.note],
  });
  const entryId = Number(res.lastInsertRowid);
  for (const it of input.items) {
    await c.execute({
      sql: `INSERT INTO food_items (entry_id, name, amount_g, kcal, protein_g, carb_g, fat_g)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        entryId,
        it.name,
        it.amountG,
        round(it.kcal),
        round(it.proteinG, 1),
        round(it.carbG, 1),
        round(it.fatG, 1),
      ],
    });
  }
}

export async function getFoodEntries(date: string): Promise<FoodEntry[]> {
  await ensureSchema();
  const c = db();
  const entriesRs = await c.execute({
    sql: `SELECT * FROM food_entries WHERE date = ? ORDER BY id ASC`,
    args: [date],
  });
  const entries = entriesRs.rows as unknown as Record<string, unknown>[];
  if (entries.length === 0) return [];

  const ids = entries.map((e) => Number(e.id));
  const placeholders = ids.map(() => "?").join(",");
  const itemsRs = await c.execute({
    sql: `SELECT * FROM food_items WHERE entry_id IN (${placeholders}) ORDER BY id ASC`,
    args: ids,
  });
  const itemsByEntry = new Map<number, FoodItem[]>();
  for (const row of itemsRs.rows as unknown as Record<string, unknown>[]) {
    const eid = Number(row.entry_id);
    const item: FoodItem = {
      id: Number(row.id),
      name: str(row.name) ?? "",
      amountG: num(row.amount_g),
      kcal: n0(row.kcal),
      proteinG: n0(row.protein_g),
      carbG: n0(row.carb_g),
      fatG: n0(row.fat_g),
    };
    const arr = itemsByEntry.get(eid) ?? [];
    arr.push(item);
    itemsByEntry.set(eid, arr);
  }

  return entries.map((e) => ({
    id: Number(e.id),
    date: str(e.date) ?? date,
    createdAt: str(e.created_at) ?? "",
    source: (str(e.source) as "photo" | "text") ?? "text",
    rawInput: str(e.raw_input),
    note: str(e.note),
    items: itemsByEntry.get(Number(e.id)) ?? [],
  }));
}

export async function deleteFoodEntry(id: number): Promise<void> {
  await ensureSchema();
  const c = db();
  await c.execute({ sql: `DELETE FROM food_items WHERE entry_id = ?`, args: [id] });
  await c.execute({ sql: `DELETE FROM food_entries WHERE id = ?`, args: [id] });
}

export type FoodItemPatch = Partial<{
  name: string;
  amountG: number | null;
  kcal: number;
  proteinG: number;
  carbG: number;
  fatG: number;
}>;

const FOOD_ITEM_COLUMNS: Record<string, string> = {
  name: "name",
  amountG: "amount_g",
  kcal: "kcal",
  proteinG: "protein_g",
  carbG: "carb_g",
  fatG: "fat_g",
};

/** Update one food item. Missing row is a silent no-op (best-effort, single user). */
export async function updateFoodItem(
  id: number,
  patch: FoodItemPatch,
): Promise<void> {
  await ensureSchema();
  const sets: string[] = [];
  const args: (string | number | null)[] = [];
  for (const [key, col] of Object.entries(FOOD_ITEM_COLUMNS)) {
    if (key in patch) {
      let v = (patch as Record<string, unknown>)[key] as
        | string
        | number
        | null;
      if (typeof v === "number") {
        v = key === "kcal" ? round(v) : key === "amountG" ? v : round(v, 1);
      }
      sets.push(`${col} = ?`);
      args.push(v ?? null);
    }
  }
  if (sets.length === 0) return;
  args.push(id);
  await db().execute({
    sql: `UPDATE food_items SET ${sets.join(", ")} WHERE id = ?`,
    args,
  });
}

/* ---------- exercise ---------- */

export async function addExerciseEntry(input: {
  date: string;
  type: string;
  whenText: string | null;
  caloriesBurned: number;
  note: string | null;
}): Promise<void> {
  await ensureSchema();
  await db().execute({
    sql: `INSERT INTO exercise_entries (date, created_at, type, when_text, calories_burned, note)
          VALUES (?, ?, ?, ?, ?, ?)`,
    args: [
      input.date,
      new Date().toISOString(),
      input.type,
      input.whenText,
      round(input.caloriesBurned),
      input.note,
    ],
  });
}

export async function getExerciseEntries(date: string): Promise<ExerciseEntry[]> {
  await ensureSchema();
  const rs = await db().execute({
    sql: `SELECT * FROM exercise_entries WHERE date = ? ORDER BY id ASC`,
    args: [date],
  });
  return (rs.rows as unknown as Record<string, unknown>[]).map((r) => ({
    id: Number(r.id),
    date: str(r.date) ?? date,
    createdAt: str(r.created_at) ?? "",
    type: str(r.type) ?? "",
    whenText: str(r.when_text),
    caloriesBurned: n0(r.calories_burned),
    note: str(r.note),
  }));
}

export async function deleteExerciseEntry(id: number): Promise<void> {
  await ensureSchema();
  await db().execute({ sql: `DELETE FROM exercise_entries WHERE id = ?`, args: [id] });
}

export type ExerciseEntryPatch = Partial<{
  type: string;
  whenText: string | null;
  caloriesBurned: number;
  note: string | null;
}>;

const EXERCISE_COLUMNS: Record<string, string> = {
  type: "type",
  whenText: "when_text",
  caloriesBurned: "calories_burned",
  note: "note",
};

/** Update one exercise entry. Missing row is a silent no-op (best-effort, single user). */
export async function updateExerciseEntry(
  id: number,
  patch: ExerciseEntryPatch,
): Promise<void> {
  await ensureSchema();
  const sets: string[] = [];
  const args: (string | number | null)[] = [];
  for (const [key, col] of Object.entries(EXERCISE_COLUMNS)) {
    if (key in patch) {
      let v = (patch as Record<string, unknown>)[key] as
        | string
        | number
        | null;
      if (key === "caloriesBurned" && typeof v === "number") v = round(v);
      sets.push(`${col} = ?`);
      args.push(v ?? null);
    }
  }
  if (sets.length === 0) return;
  args.push(id);
  await db().execute({
    sql: `UPDATE exercise_entries SET ${sets.join(", ")} WHERE id = ?`,
    args,
  });
}

/* ---------- favorites ---------- */
/*
 * Favorites are snapshots: creating one copies the row's values, and there is
 * no link back to the logged item. Edits/deletes on either side are independent.
 */

function mapFoodFavorite(r: Record<string, unknown>): FoodFavorite {
  return {
    id: Number(r.id),
    name: str(r.name) ?? "",
    amountG: num(r.amount_g),
    kcal: n0(r.kcal),
    proteinG: n0(r.protein_g),
    carbG: n0(r.carb_g),
    fatG: n0(r.fat_g),
    createdAt: str(r.created_at) ?? "",
  };
}

export async function addFoodFavorite(input: {
  name: string;
  amountG: number | null;
  kcal: number;
  proteinG: number;
  carbG: number;
  fatG: number;
}): Promise<FoodFavorite> {
  await ensureSchema();
  const res = await db().execute({
    sql: `INSERT INTO food_favorites (name, amount_g, kcal, protein_g, carb_g, fat_g, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [
      input.name,
      input.amountG,
      round(input.kcal),
      round(input.proteinG, 1),
      round(input.carbG, 1),
      round(input.fatG, 1),
      new Date().toISOString(),
    ],
  });
  const rs = await db().execute({
    sql: `SELECT * FROM food_favorites WHERE id = ?`,
    args: [Number(res.lastInsertRowid)],
  });
  return mapFoodFavorite(rs.rows[0] as Record<string, unknown>);
}

export async function getFoodFavorites(): Promise<FoodFavorite[]> {
  await ensureSchema();
  const rs = await db().execute(
    `SELECT * FROM food_favorites ORDER BY id DESC`,
  );
  return (rs.rows as unknown as Record<string, unknown>[]).map(mapFoodFavorite);
}

export async function deleteFoodFavorite(id: number): Promise<void> {
  await ensureSchema();
  await db().execute({ sql: `DELETE FROM food_favorites WHERE id = ?`, args: [id] });
}

/**
 * Log a favorite as a normal food entry (no AI call). If amountG is given and
 * the favorite has a positive stored amount, macros scale proportionally;
 * otherwise the favorite is logged verbatim and the override is ignored.
 */
export async function logFoodFavorite(
  id: number,
  date: string,
  amountG?: number,
): Promise<boolean> {
  await ensureSchema();
  const rs = await db().execute({
    sql: `SELECT * FROM food_favorites WHERE id = ?`,
    args: [id],
  });
  if (rs.rows.length === 0) return false;
  const fav = mapFoodFavorite(rs.rows[0] as Record<string, unknown>);

  let item: NewFoodItem = {
    name: fav.name,
    amountG: fav.amountG,
    kcal: fav.kcal,
    proteinG: fav.proteinG,
    carbG: fav.carbG,
    fatG: fav.fatG,
  };
  if (amountG != null && fav.amountG != null && fav.amountG > 0) {
    const f = amountG / fav.amountG;
    item = {
      name: fav.name,
      amountG,
      kcal: round(fav.kcal * f),
      proteinG: round(fav.proteinG * f, 1),
      carbG: round(fav.carbG * f, 1),
      fatG: round(fav.fatG * f, 1),
    };
  }

  await addFoodEntry({
    date,
    source: "text",
    rawInput: `(favorite: ${fav.name})`,
    note: null,
    items: [item],
  });
  return true;
}

function mapExerciseFavorite(r: Record<string, unknown>): ExerciseFavorite {
  return {
    id: Number(r.id),
    type: str(r.type) ?? "",
    caloriesBurned: n0(r.calories_burned),
    createdAt: str(r.created_at) ?? "",
  };
}

export async function addExerciseFavorite(input: {
  type: string;
  caloriesBurned: number;
}): Promise<ExerciseFavorite> {
  await ensureSchema();
  const res = await db().execute({
    sql: `INSERT INTO exercise_favorites (type, calories_burned, created_at)
          VALUES (?, ?, ?)`,
    args: [input.type, round(input.caloriesBurned), new Date().toISOString()],
  });
  const rs = await db().execute({
    sql: `SELECT * FROM exercise_favorites WHERE id = ?`,
    args: [Number(res.lastInsertRowid)],
  });
  return mapExerciseFavorite(rs.rows[0] as Record<string, unknown>);
}

export async function getExerciseFavorites(): Promise<ExerciseFavorite[]> {
  await ensureSchema();
  const rs = await db().execute(
    `SELECT * FROM exercise_favorites ORDER BY id DESC`,
  );
  return (rs.rows as unknown as Record<string, unknown>[]).map(
    mapExerciseFavorite,
  );
}

export async function deleteExerciseFavorite(id: number): Promise<void> {
  await ensureSchema();
  await db().execute({
    sql: `DELETE FROM exercise_favorites WHERE id = ?`,
    args: [id],
  });
}

/** Re-log a favorite verbatim as a normal exercise entry (whenText left empty). */
export async function logExerciseFavorite(
  id: number,
  date: string,
): Promise<boolean> {
  await ensureSchema();
  const rs = await db().execute({
    sql: `SELECT * FROM exercise_favorites WHERE id = ?`,
    args: [id],
  });
  if (rs.rows.length === 0) return false;
  const fav = mapExerciseFavorite(rs.rows[0] as Record<string, unknown>);
  await addExerciseEntry({
    date,
    type: fav.type,
    whenText: null,
    caloriesBurned: fav.caloriesBurned,
    note: null,
  });
  return true;
}

/* ---------- day assembly ---------- */

export async function computeDay(date: string): Promise<DayState> {
  const [profile, foodEntries, exercise] = await Promise.all([
    getProfile(),
    getFoodEntries(date),
    getExerciseEntries(date),
  ]);

  const consumed: Macros = { kcal: 0, protein: 0, carb: 0, fat: 0 };
  for (const entry of foodEntries) {
    for (const it of entry.items) {
      consumed.kcal += it.kcal;
      consumed.protein += it.proteinG;
      consumed.carb += it.carbG;
      consumed.fat += it.fatG;
    }
  }
  consumed.kcal = round(consumed.kcal);
  consumed.protein = round(consumed.protein, 1);
  consumed.carb = round(consumed.carb, 1);
  consumed.fat = round(consumed.fat, 1);

  const exerciseBurned = round(
    exercise.reduce((s, e) => s + e.caloriesBurned, 0),
  );

  const targets: Macros = {
    kcal: profile.targetCalories ?? 0,
    protein: profile.proteinG ?? 0,
    carb: profile.carbG ?? 0,
    fat: profile.fatG ?? 0,
  };

  const kcalBudget =
    targets.kcal + (profile.addExerciseBack ? exerciseBurned : 0);
  const remaining: Macros = {
    kcal: round(kcalBudget - consumed.kcal),
    protein: round(targets.protein - consumed.protein, 1),
    carb: round(targets.carb - consumed.carb, 1),
    fat: round(targets.fat - consumed.fat, 1),
  };

  return {
    date,
    profile,
    foodEntries,
    exercise,
    consumed,
    exerciseBurned,
    targets,
    remaining,
  };
}
