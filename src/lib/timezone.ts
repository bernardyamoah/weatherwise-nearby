import { TimezoneInfo } from "./types";

interface GoogleTimezoneResponse {
  status: string;
  timeZoneId: string;
  timeZoneName: string;
  dstOffset: number;
  rawOffset: number;
  errorMessage?: string;
}

export async function getTimezone(lat: number, lng: number): Promise<TimezoneInfo> {
  const apiKey = process.env.PLACES_API_KEY; // Same key works for Timezone API
  if (!apiKey) {
    throw new Error("PLACES_API_KEY is not configured");
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const url = new URL("https://maps.googleapis.com/maps/api/timezone/json");
  url.searchParams.set("location", `${lat},${lng}`);
  url.searchParams.set("timestamp", timestamp.toString());
  url.searchParams.set("key", apiKey);

  const response = await fetch(url.toString());

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Timezone API error: ${response.status} - ${error}`);
  }

  const data: GoogleTimezoneResponse = await response.json();

  if (data.status !== "OK") {
    throw new Error(`Timezone API error: ${data.status} - ${data.errorMessage}`);
  }

  // Calculate local time using offset
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60 * 1000;
  const localMs = utcMs + (data.rawOffset + data.dstOffset) * 1000;
  const localTime = new Date(localMs);

  return {
    timezoneId: data.timeZoneId,
    localTime: localTime.toISOString(),
  };
}

export function getLocalHour(timezoneId: string): number {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezoneId,
    hour: "numeric",
    hour12: false,
  });
  return parseInt(formatter.format(now), 10);
}

export function getLocalDayOfWeek(timezoneId: string): number {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezoneId,
    weekday: "short",
  });
  const dayName = formatter.format(now);
  const days: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return days[dayName] ?? 0;
}
