import { OpeningHours, Place } from "./types";

interface GooglePlacesResponse {
  results: GooglePlace[];
  status: string;
  error_message?: string;
}

interface GooglePlace {
  place_id: string;
  name: string;
  types: string[];
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  opening_hours?: {
    open_now: boolean;
    periods?: {
      open: { day: number; time: string };
      close?: { day: number; time: string };
    }[];
  };
  vicinity?: string;
  rating?: number;
  photos?: {
    photo_reference: string;
  }[];
}

interface GooglePlaceDetailsResponse {
  result?: {
    website?: string;
    url?: string;
    formatted_phone_number?: string;
    international_phone_number?: string;
  };
  status: string;
  error_message?: string;
}

function parseTime(time: string): { hour: number; minute: number } {
  // Google returns time as "HHMM" string
  return {
    hour: parseInt(time.slice(0, 2), 10),
    minute: parseInt(time.slice(2, 4), 10),
  };
}

function normalizeOpeningHours(
  googleHours?: GooglePlace["opening_hours"]
): OpeningHours | undefined {
  if (!googleHours) return undefined;

  return {
    openNow: googleHours.open_now,
    periods: googleHours.periods?.map((period) => ({
      open: {
        day: period.open.day,
        ...parseTime(period.open.time),
      },
      close: period.close
        ? {
            day: period.close.day,
            ...parseTime(period.close.time),
          }
        : { day: period.open.day, hour: 23, minute: 59 },
    })),
  };
}

function buildPhotoUrl(photoReference: string, apiKey: string): string {
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${photoReference}&key=${apiKey}`;
}

export async function fetchNearbyPlaces(
  lat: number,
  lng: number,
  radius: number = 1500,
  keyword?: string | null
): Promise<Place[]> {
  const apiKey = process.env.PLACES_API_KEY;
  if (!apiKey) {
    throw new Error("PLACES_API_KEY is not configured");
  }

  const url = new URL(
    "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
  );
  url.searchParams.set("location", `${lat},${lng}`);
  url.searchParams.set("radius", radius.toString());
  url.searchParams.set("key", apiKey);
  
  if (keyword) {
    url.searchParams.set("keyword", keyword);
  } else {
    // Focus on places people would visit
    url.searchParams.set(
      "type",
      "restaurant|cafe|bar|museum|park|shopping_mall|gym|library|movie_theater"
    );
  }

  console.log("[Places] Fetching nearby places for", lat, lng);

  const response = await fetch(url.toString());

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Places API error: ${response.status} - ${error}`);
  }

  const data: GooglePlacesResponse = await response.json();

  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    throw new Error(`Places API error: ${data.status} - ${data.error_message}`);
  }

  const places: Place[] = data.results.slice(0, 60).map((place) => ({
    id: place.place_id,
    name: place.name,
    types: place.types,
    location: {
      lat: place.geometry.location.lat,
      lng: place.geometry.location.lng,
    },
    openingHours: normalizeOpeningHours(place.opening_hours),
    vicinity: place.vicinity,
    rating: place.rating,
    photoUrl: place.photos?.[0]
      ? buildPhotoUrl(place.photos[0].photo_reference, apiKey)
      : undefined,
    googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${place.geometry.location.lat},${place.geometry.location.lng}&query_place_id=${place.place_id}`,
  }));

  console.log("[Places] Found", places.length, "places");

  return places;
}

// Indoor/outdoor classification based on place types
const INDOOR_TYPES = new Set([
  "restaurant",
  "cafe",
  "bar",
  "museum",
  "shopping_mall",
  "gym",
  "library",
  "movie_theater",
  "spa",
  "bowling_alley",
  "casino",
  "night_club",
  "store",
  "supermarket",
  "book_store",
  "clothing_store",
  "department_store",
  "electronics_store",
  "furniture_store",
  "home_goods_store",
  "jewelry_store",
  "shoe_store",
  "art_gallery",
  "aquarium",
]);

const OUTDOOR_TYPES = new Set([
  "park",
  "campground",
  "zoo",
  "amusement_park",
  "stadium",
  "tourist_attraction",
  "natural_feature",
]);

export function isIndoorPlace(types: string[]): boolean {
  return types.some((type) => INDOOR_TYPES.has(type));
}

export function isOutdoorPlace(types: string[]): boolean {
  return types.some((type) => OUTDOOR_TYPES.has(type));
}

export function getPlaceCategory(types: string[]): "indoor" | "outdoor" | "mixed" {
  const isIndoor = isIndoorPlace(types);
  const isOutdoor = isOutdoorPlace(types);

  if (isIndoor && !isOutdoor) return "indoor";
  if (isOutdoor && !isIndoor) return "outdoor";
  return "mixed";
}

const RESTAURANT_TYPES = new Set([
  "restaurant",
  "food",
  "meal_takeaway",
  "meal_delivery",
  "cafe",
]);

export function isRestaurant(types: string[]) {
  return types.some((type) => RESTAURANT_TYPES.has(type));
}

export async function fetchPlaceDetails(placeId: string): Promise<Partial<Place>> {
  const apiKey = process.env.PLACES_API_KEY;
  if (!apiKey) {
    throw new Error("PLACES_API_KEY is not configured");
  }

  const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
  url.searchParams.set("place_id", placeId);
  url.searchParams.set("fields", "website,url,formatted_phone_number,international_phone_number");
  url.searchParams.set("key", apiKey);

  const response = await fetch(url.toString());
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Place Details error: ${response.status} - ${error}`);
  }

  const data: GooglePlaceDetailsResponse = await response.json();

  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    throw new Error(`Place Details error: ${data.status} - ${data.error_message}`);
  }

  const website = data.result?.website;
  const mapsUrl = data.result?.url;
  const phone = data.result?.international_phone_number || data.result?.formatted_phone_number;
  return {
    website,
    menuUrl: website || mapsUrl,
    googleMapsUrl: mapsUrl,
    phone,
  };
}
