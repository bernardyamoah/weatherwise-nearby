import { env } from "@/lib/env";
import { Weather } from "@/lib/types";
import { NextResponse } from "next/server";
import { OpenAI } from "openai";

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const { weather } = (await req.json()) as { weather?: Weather };

    if (!weather) {
      return NextResponse.json({ error: "Weather required" }, { status: 400 });
    }

    const prompt = `You are a concise safety assistant. Current weather: ${weather.temperature}°C, ${weather.description} (${weather.category}). Feels like ${weather.current?.apparentTemperature ?? weather.temperature}°C, wind ${weather.current?.windSpeed10m ?? 0} km/h, humidity ${weather.current?.relativeHumidity2m ?? "n/a"}%. Provide up to 3 short alerts as JSON: [{id, title, message, severity}] where severity is "warning" or "caution". Keep titles under 6 words and messages under 28 words.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Return safety alerts tuned for a weather-and-places web app." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      max_tokens: 300,
      temperature: 0.4,
    });

    const raw = response.choices[0]?.message?.content || "{}";
    let parsed: { alerts?: Array<{ id: string; title: string; message: string; severity: "warning" | "caution" }> } = {};
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      console.warn("[AI Alerts] parse error", error);
    }

    return NextResponse.json({ alerts: parsed.alerts || [] });
  } catch (error) {
    console.error("[AI Alerts Error]", error);
    return NextResponse.json({ error: "Failed to build alerts" }, { status: 500 });
  }
}
