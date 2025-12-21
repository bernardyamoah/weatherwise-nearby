import { env } from "@/lib/env";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  input: z.string().min(2),
});

interface AutocompletePrediction {
  description: string;
  place_id: string;
}

interface AutocompleteResponse {
  predictions: AutocompletePrediction[];
  status: string;
  error_message?: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parse = schema.safeParse({ input: searchParams.get("input") || "" });

  if (!parse.success) {
    return NextResponse.json({ error: "input is required" }, { status: 400 });
  }

  const input = parse.data.input;
  const apiKey = env.PLACES_API_KEY;

  try {
    const url = new URL("https://maps.googleapis.com/maps/api/place/autocomplete/json");
    url.searchParams.set("input", input);
    url.searchParams.set("types", "geocode");
    url.searchParams.set("key", apiKey);

    const response = await fetch(url.toString(), { cache: "no-store" });
    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json({ error: `Autocomplete failed: ${error}` }, { status: 500 });
    }

    const data: AutocompleteResponse = await response.json();
    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      return NextResponse.json({ error: data.error_message || "Autocomplete error" }, { status: 500 });
    }

    return NextResponse.json({ predictions: data.predictions ?? [] });
  } catch (error) {
    console.error("[Autocomplete] Error", error);
    return NextResponse.json({ error: "Failed to fetch suggestions" }, { status: 500 });
  }
}
