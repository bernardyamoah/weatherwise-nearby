import { env } from "@/lib/env";
import { NextResponse } from "next/server";
import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

interface BriefingPlace {
  name: string;
  explanation?: string;
}

export async function POST(req: Request) {
  try {
    const { weather, recommendations, localTime } = (await req.json()) as {
      weather?: { temperature?: number; description?: string; category?: string };
      recommendations?: BriefingPlace[];
      localTime?: string;
    };

    if (!weather || !recommendations) {
      return NextResponse.json(
        { error: "Weather and recommendations are required" },
        { status: 400 }
      );
    }

    const prompt = `
      You are a helpful, witty AI assistant for WeatherWise Nearby. 
      Current Local Time: ${localTime}
      Current Weather: ${weather.temperature}°C, ${weather.description} (${weather.category})
      Recommended Nearby Places: ${recommendations
        .slice(0, 3)
        .map((r) => `${r.name} (${r.explanation || "great vibes"})`)
        .join(", ")}

      Write a concise, catchy 2-3 sentence internal briefing for the user. 
      - Mention the current weather vibe.
      - Suggest one of the recommended places based on the current weather.
      - Keep it helpful and personal.
      - Do not use markdown (except bolding for place names).
      - Max 60 words.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a concise weather and lifestyle expert." },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 150,
    });

    const briefing = response.choices[0]?.message?.content || "Getting ready for your day!";

    return NextResponse.json({ briefing });
  } catch (error: unknown) {
    console.error("[AI Briefing Error]:", error);
    return NextResponse.json(
      { error: "Failed to generate AI briefing" },
      { status: 500 }
    );
  }
}
