"use client";

import { useRef, useState } from "react";
import { api, fileToResizedBase64 } from "@/lib/client";
import type { DayState } from "@/lib/types";
import { Banner, Button, GlassCard } from "./ui";

type Tab = "food" | "exercise";

export function Logger({
  date,
  onDay,
}: {
  date: string;
  onDay: (day: DayState) => void;
}) {
  const [tab, setTab] = useState<Tab>("food");

  return (
    <GlassCard>
      <div className="mb-4 flex items-center gap-2">
        <h2 className="text-lg font-semibold">Log</h2>
        <span className="text-xs text-slate-500 dark:text-slate-400">Section 2</span>
      </div>

      <div className="mb-4 flex gap-1 rounded-xl border border-white/40 bg-white/40 p-1 dark:border-white/10 dark:bg-white/5">
        {(["food", "exercise"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={
              "flex-1 rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition " +
              (tab === t
                ? "bg-slate-900 text-white shadow dark:bg-white dark:text-slate-900"
                : "text-slate-600 hover:bg-white/50 dark:text-slate-300 dark:hover:bg-white/10")
            }
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "food" ? (
        <FoodForm date={date} onDay={onDay} />
      ) : (
        <ExerciseForm date={date} onDay={onDay} />
      )}
    </GlassCard>
  );
}

function FoodForm({
  date,
  onDay,
}: {
  date: string;
  onDay: (day: DayState) => void;
}) {
  const [text, setText] = useState("");
  const [image, setImage] = useState<{
    preview: string;
    base64: string;
    mediaType: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      const { base64, mediaType } = await fileToResizedBase64(file);
      setImage({ preview: `data:${mediaType};base64,${base64}`, base64, mediaType });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read image.");
    }
  }

  async function submit() {
    if (!image && !text.trim()) {
      setError("Add a photo or describe the food.");
      return;
    }
    setError(null);
    setNote(null);
    setLoading(true);
    try {
      const res = await api<{ day: DayState; note: string; added: number }>(
        "/api/food/analyze",
        {
          method: "POST",
          body: JSON.stringify({
            date,
            text,
            imageBase64: image?.base64,
            mediaType: image?.mediaType,
          }),
        },
      );
      onDay(res.day);
      setText("");
      setImage(null);
      if (fileRef.current) fileRef.current.value = "";
      setNote(
        res.added > 0
          ? res.note || `Added ${res.added} item${res.added > 1 ? "s" : ""}.`
          : res.note || "No food detected.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <textarea
        className="glass-input min-h-[70px] resize-y"
        placeholder="Describe the food & weight — e.g. '150g grilled chicken breast and 200g white rice'"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={onPickFile}
          className="hidden"
          id="food-photo"
        />
        <label htmlFor="food-photo" className="btn btn-ghost cursor-pointer">
          📷 {image ? "Change photo" : "Add photo"}
        </label>
        {image && (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.preview}
              alt="food preview"
              className="h-16 w-16 rounded-xl object-cover shadow"
            />
            <button
              type="button"
              onClick={() => {
                setImage(null);
                if (fileRef.current) fileRef.current.value = "";
              }}
              className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-xs text-white"
              aria-label="Remove photo"
            >
              ×
            </button>
          </div>
        )}
        <Button onClick={submit} loading={loading} className="ml-auto">
          Analyse &amp; log
        </Button>
      </div>

      {note && <Banner kind="info">{note}</Banner>}
      {error && <Banner kind="error">{error}</Banner>}
    </div>
  );
}

function ExerciseForm({
  date,
  onDay,
}: {
  date: string;
  onDay: (day: DayState) => void;
}) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!text.trim()) {
      setError("Describe the exercise.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await api<{ day: DayState }>("/api/exercise/analyze", {
        method: "POST",
        body: JSON.stringify({ date, text }),
      });
      onDay(res.day);
      setText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <textarea
        className="glass-input min-h-[70px] resize-y"
        placeholder="Type, when & calories — e.g. 'ran 30 min this morning, ~300 kcal' (calories optional; AI estimates)"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="flex">
        <Button onClick={submit} loading={loading} className="ml-auto">
          Log exercise
        </Button>
      </div>
      {error && <Banner kind="error">{error}</Banner>}
    </div>
  );
}
