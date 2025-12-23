import { env } from "@/lib/env";
import { NextResponse } from "next/server";
import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

type PackingRequest = {
  weather?: {
    temperature?: number;
    description?: string;
    condition?: string;
    category?: string;
    current?: { windSpeed10m?: number; relativeHumidity2m?: number };
  };
  timezone?: string;
  localTime?: string;
};

export async function POST(req: Request) {
  try {
    const { weather, timezone, localTime } = (await req.json()) as PackingRequest;

    if (!weather) {
      return NextResponse.json(
        { error: "Weather details are required" },
        { status: 400 }
      );
    }

    const prompt = `Current weather: ${weather.temperature ?? "?"}°C, ${
      weather.description || weather.condition || "unknown conditions"
    } (${weather.category || "n/a"}). Local time: ${localTime || "unknown"} ${
      timezone || "local"
    }.
    Provide concise packing advice for a short outing within the next few hours. Return JSON with keys: summary (max 30 words), packingList (5-6 short bullet phrases), and safety (1 short caution tailored to the weather). Prioritize comfort and weather readiness.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a concise packing assistant for quick neighborhood trips." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.5,
      max_tokens: 300,
    });

    const rawContent = response.choices[0]?.message?.content || "{}";

    let parsed: { summary?: string; packingList?: string[]; safety?: string } = {};
    try {
      parsed = JSON.parse(rawContent);
    } catch (error) {
      console.warn("[AI Packing] Failed to parse JSON response", error);
    }

    return NextResponse.json({
      summary: parsed.summary || "Pack light and stay comfy for the current conditions.",
      packingList: parsed.packingList?.slice(0, 6) || [],
      safety: parsed.safety || "Check the sky and stay hydrated.",
    });
  } catch (error) {
    console.error("[AI Packing Error]:", error);
    return NextResponse.json(
      { error: "Failed to generate packing guidance" },
      { status: 500 }
    );
  }
}
