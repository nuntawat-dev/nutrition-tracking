import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { generateJSON } from "@/lib/anthropic";
import { addFoodEntry, computeDay } from "@/lib/data";
import { isValidDate, serverToday } from "@/lib/date";
import { foodJsonSchema, foodResult } from "@/lib/schemas";
import { foodSystem, foodUser } from "@/lib/prompts";

export const runtime = "nodejs";
export const maxDuration = 60;

const ALLOWED_MEDIA = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    date?: string;
    text?: string;
    imageBase64?: string;
    mediaType?: string;
  };

  const date = isValidDate(body.date) ? body.date : serverToday();
  const text = typeof body.text === "string" ? body.text : "";
  const hasImage =
    typeof body.imageBase64 === "string" &&
    body.imageBase64.length > 0 &&
    ALLOWED_MEDIA.has(body.mediaType ?? "");

  if (!hasImage && !text.trim()) {
    return NextResponse.json(
      { error: "Add a photo or a description of the food." },
      { status: 400 },
    );
  }

  const content: Anthropic.ContentBlockParam[] = [];
  if (hasImage) {
    content.push({
      type: "image",
      source: {
        type: "base64",
        media_type: body.mediaType as
          | "image/jpeg"
          | "image/png"
          | "image/gif"
          | "image/webp",
        data: body.imageBase64 as string,
      },
    });
  }
  content.push({ type: "text", text: foodUser(text, hasImage) });

  try {
    const raw = await generateJSON({
      system: foodSystem,
      content,
      schema: foodJsonSchema as unknown as Record<string, unknown>,
      maxTokens: 2048,
    });
    const parsed = foodResult.parse(raw);

    if (parsed.items.length > 0) {
      await addFoodEntry({
        date,
        source: hasImage ? "photo" : "text",
        rawInput: text.trim() || (hasImage ? "(photo)" : ""),
        note: parsed.note || null,
        items: parsed.items.map((it) => ({
          name: it.name,
          amountG: it.amountG,
          kcal: it.kcal,
          proteinG: it.proteinG,
          carbG: it.carbG,
          fatG: it.fatG,
        })),
      });
    }

    const day = await computeDay(date);
    return NextResponse.json({ day, note: parsed.note, added: parsed.items.length });
  } catch (err) {
    console.error("food/analyze failed:", err);
    return NextResponse.json(
      { error: "Could not analyse the food. Please try again." },
      { status: 502 },
    );
  }
}
