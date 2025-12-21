import { fetchNearbyPlaces } from "@/lib/places";
import { rankPlaces } from "@/lib/ranking";
import { getTimezone } from "@/lib/timezone";
import { DiscoveryResponse } from "@/lib/types";
import { fetchWeather } from "@/lib/weather";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const querySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  q: z.string().optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const parseResult = querySchema.safeParse({
      lat: searchParams.get("lat"),
      lng: searchParams.get("lng"),
      q: searchParams.get("q"),
    });

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid coordinates or query. Required: lat, lng" },
        { status: 400 }
      );
    }

    const { lat, lng, q } = parseResult.data;
    const userLocation = { lat, lng };

    // Fetch all data in parallel
    const [weather, places, timezoneInfo] = await Promise.all([
      fetchWeather(lat, lng),
      fetchNearbyPlaces(lat, lng, 5000, q),
      getTimezone(lat, lng),
    ]);

    // Rank places based on weather
    const recommendations = rankPlaces({
      places,
      userLocation,
      weatherCategory: weather.category,
      timezoneId: timezoneInfo.timezoneId,
    });

    const response: DiscoveryResponse = {
      weather,
      localTime: timezoneInfo.localTime,
      timezone: timezoneInfo.timezoneId,
      recommendations,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[Discovery API] Error:", error);

    const message = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { error: "Failed to fetch recommendations", details: message },
      { status: 500 }
    );
  }
}
