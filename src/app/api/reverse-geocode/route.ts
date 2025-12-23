import { env } from "@/lib/env";
import { NextResponse } from "next/server";
import { z } from "zod";

const querySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parse = querySchema.safeParse({
    lat: searchParams.get("lat"),
    lng: searchParams.get("lng"),
  });

  if (!parse.success) {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  }

  const { lat, lng } = parse.data;
  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("latlng", `${lat},${lng}`);
  url.searchParams.set("key", env.PLACES_API_KEY);
  url.searchParams.set("result_type", "locality|administrative_area_level_1|country");

  try {
    const res = await fetch(url.toString(), { cache: "no-store" });

    if (!res.ok) {
      const message = await res.text();
      return NextResponse.json({ error: "Reverse geocode failed", details: message }, { status: res.status });
    }

    const data = await res.json();
    const primary = data.results?.[0];

    if (!primary) {
      return NextResponse.json({ error: "No location found" }, { status: 404 });
    }

    const components = primary.address_components || [];
    const city = components.find((c: any) => c.types.includes("locality"))?.long_name;
    const admin = components.find((c: any) => c.types.includes("administrative_area_level_1"))?.short_name;
    const country = components.find((c: any) => c.types.includes("country"))?.long_name;

    const label =
      city && country
        ? `${city}${admin ? `, ${admin}` : ""}, ${country}`
        : primary.formatted_address || country || null;

    return NextResponse.json({
      label,
      city,
      admin,
      country,
      formatted: primary.formatted_address || null,
    });
  } catch (error) {
    console.error("[ReverseGeocode] Error", error);
    return NextResponse.json({ error: "Failed to reverse geocode" }, { status: 500 });
  }
}
