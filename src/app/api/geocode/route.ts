import { env } from "@/lib/env";
import { NextResponse } from "next/server";
import { z } from "zod";

const requestSchema = z.object({
  query: z.string().min(1, "Query is required"),
});

interface PlacesTextSearchResult {
  results: Array<{
    name: string;
    formatted_address?: string;
    geometry: { location: { lat: number; lng: number } };
    place_id: string;
  }>;
  status: string;
  error_message?: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parse = requestSchema.safeParse(body);
    if (!parse.success) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const { query } = parse.data;
    const apiKey = env.PLACES_API_KEY;

    const url = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json");
    url.searchParams.set("query", query);
    url.searchParams.set("key", apiKey);

    const response = await fetch(url.toString(), { cache: "no-store" });
    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json({ error: `Geocode failed: ${error}` }, { status: 500 });
    }

    const data: PlacesTextSearchResult = await response.json();
    if ((data.status !== "OK" && data.status !== "ZERO_RESULTS") || !data.results.length) {
      return NextResponse.json({ error: "No results found" }, { status: 404 });
    }

    const first = data.results[0];
    return NextResponse.json({
      name: first.name,
      address: first.formatted_address,
      lat: first.geometry.location.lat,
      lng: first.geometry.location.lng,
      placeId: first.place_id,
    });
  } catch (error) {
    console.error("[Geocode] Error", error);
    return NextResponse.json({ error: "Failed to search location" }, { status: 500 });
  }
}
