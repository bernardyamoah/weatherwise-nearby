import { env } from "@/lib/env";
import { NextResponse } from "next/server";
import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

type PlaceInsightRequest = {
  place?: {
    name: string;
    types?: string[];
    rating?: number;
    explanation?: string;
    distance?: number;
    isOpen?: boolean;
  };
  weather?: {
    temperature?: number;
    description?: string;
    category?: string;
    condition?: string;
  };
  localTime?: string;
  timezone?: string;
};

export async function POST(req: Request) {
  try {
    const { place, weather, localTime, timezone } = (await req.json()) as PlaceInsightRequest;

    if (!place || !weather) {
      return NextResponse.json(
        { error: "Place and weather details are required" },
        { status: 400 }
      );
    }

    const prompt = `You are a local concierge. Craft a short AI blurb for the selected place.
    Place: ${place.name}
    Rating: ${place.rating ?? "n/a"}
    Types: ${(place.types || []).join(", ")}
    Distance: ${place.distance ? `${place.distance.toFixed(1)} km` : "unknown"}
    Open Now: ${place.isOpen ? "Yes" : "No or unsure"}
    Description: ${place.explanation || "Weather-matched spot"}
    Weather: ${weather.temperature ?? "?"}°C, ${weather.description || weather.condition || ""} (${weather.category || "n/a"})
    Local Time: ${localTime || "unknown"} ${timezone || ""}

    Return JSON with keys: headline (max 8 words), tip (1-2 sentences on why to go now, max 45 words), and weatherNote (1 sentence about how the weather impacts the visit). Keep tone friendly and actionable.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You give concise, upbeat visit suggestions tailored to current weather." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.55,
      max_tokens: 280,
    });

    const rawContent = response.choices[0]?.message?.content || "{}";

    let parsed: { headline?: string; tip?: string; weatherNote?: string } = {};
    try {
      parsed = JSON.parse(rawContent);
    } catch (error) {
      console.warn("[AI Place Insight] Failed to parse JSON response", error);
    }

    return NextResponse.json({
      headline: parsed.headline || `${place.name} is a solid pick right now`,
      tip: parsed.tip || "This spot aligns well with the current vibe—worth a look while you’re nearby.",
      weatherNote: parsed.weatherNote || "Check the sky and dress for comfort.",
    });
  } catch (error) {
    console.error("[AI Place Insights Error]:", error);
    return NextResponse.json(
      { error: "Failed to generate place insights" },
      { status: 500 }
    );
  }
}
