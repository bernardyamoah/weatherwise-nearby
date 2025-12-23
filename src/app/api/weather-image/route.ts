import { env } from "@/lib/env";
import { NextResponse } from "next/server";
import { z } from "zod";
import { OpenAI } from "openai";

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

const querySchema = z.object({
  category: z.enum(["rainy", "hot", "cold", "clear"]),
  timeOfDay: z.string().optional(),
  temperature: z.coerce.number().optional(),
  description: z.string().optional(),
});

const CATEGORY_QUERY: Record<z.infer<typeof querySchema>["category"], string> = {
  rainy: "rainy city street moody weather",
  hot: "sunny heat haze summer sky",
  cold: "snowy winter chill overcast sky",
  clear: "clear sky golden hour skyline",
};

async function buildQuery(input: z.infer<typeof querySchema>): Promise<string> {
  const timePhrase = input.timeOfDay
    ? {
        morning: "sunrise light",
        afternoon: "bright afternoon sky",
        evening: "sunset glow",
        night: "night skyline",
      }[input.timeOfDay.toLowerCase()] || input.timeOfDay
    : "";
  const fallback = `${CATEGORY_QUERY[input.category]} ${timePhrase}`.trim();

  if (!env.UNSPLASH_ACCESS_KEY) return fallback;

  try {
    const description = (input.description || input.category).slice(0, 80);
    const temp = input.temperature !== undefined ? `${Math.round(input.temperature)}C` : "n/a";
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Return a concise Unsplash photo search query (max 6 words) that matches the weather vibe. Focus on atmosphere, sky, and light, and make sure the time of day is reflected. Output only the query text.",
        },
        {
          role: "user",
          content: `Weather: ${description}. Category: ${input.category}. Temp: ${temp}. Time of day: ${timePhrase || input.timeOfDay || "n/a"}.`,
        },
      ],
      max_tokens: 24,
      temperature: 0.4,
    });

    const candidate = response.choices[0]?.message?.content?.trim();
    if (!candidate) return fallback;
    return `${candidate} ${input.timeOfDay || ""}`.trim();
  } catch (error) {
    console.warn("[WeatherImage] AI keyword failed, using fallback", error);
    return fallback;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parse = querySchema.safeParse({
    category: searchParams.get("category"),
    timeOfDay: searchParams.get("timeOfDay") || undefined,
    temperature: searchParams.get("temperature") || undefined,
    description: searchParams.get("description") || undefined,
  });

  if (!parse.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }

  if (!env.UNSPLASH_ACCESS_KEY) {
    return NextResponse.json({ error: "Unsplash key missing" }, { status: 503 });
  }

  const { category, timeOfDay, temperature, description } = parse.data;
  const query = await buildQuery({ category, timeOfDay, temperature, description });

  const url = new URL("https://api.unsplash.com/photos/random");
  url.searchParams.set("orientation", "landscape");
  url.searchParams.set("content_filter", "high");
  url.searchParams.set("query", query);
  url.searchParams.set("client_id", env.UNSPLASH_ACCESS_KEY);

  try {
    const res = await fetch(url.toString(), { cache: "no-store" });

    if (!res.ok) {
      const message = await res.text();
      return NextResponse.json(
        { error: "Failed to fetch image", details: message },
        { status: res.status }
      );
    }

    const data = await res.json();

    return NextResponse.json({
      url: data.urls?.regular || data.urls?.full || data.urls?.small,
      alt: data.alt_description || data.description || "Weather background",
      author: data.user?.name,
      link: data.links?.html,
      query,
    });
  } catch (error) {
    console.error("[WeatherImage] Error fetching Unsplash", error);
    return NextResponse.json({ error: "Failed to fetch image" }, { status: 500 });
  }
}
