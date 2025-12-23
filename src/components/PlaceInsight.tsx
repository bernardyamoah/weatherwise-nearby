"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2, RefreshCcw, Sparkles } from "lucide-react";

import { ScoredPlace, Weather } from "@/lib/types";

import { Button } from "./ui/button";

interface PlaceInsightProps {
  place: ScoredPlace;
  weather?: Weather;
  localTime?: string;
  timezone?: string;
}

async function fetchPlaceInsight(payload: PlaceInsightProps) {
  const response = await fetch("/api/ai/place-insights", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      place: {
        name: payload.place.name,
        types: payload.place.types,
        rating: payload.place.rating,
        explanation: payload.place.explanation,
        distance: payload.place.distance,
        isOpen: payload.place.isOpen,
      },
      weather: payload.weather
        ? {
            temperature: payload.weather.temperature,
            description: payload.weather.description,
            category: payload.weather.category,
            condition: payload.weather.condition,
          }
        : undefined,
      localTime: payload.localTime,
      timezone: payload.timezone,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to load AI insight");
  }

  return response.json() as Promise<{
    headline: string;
    tip: string;
    weatherNote: string;
  }>;
}

export function PlaceInsight({ place, weather, localTime, timezone }: PlaceInsightProps) {
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: [
      "place-insight",
      place.id,
      weather?.category,
      weather?.description,
      localTime,
    ],
    queryFn: () => fetchPlaceInsight({ place, weather, localTime, timezone }),
    enabled: Boolean(weather),
    staleTime: 30 * 60 * 1000,
  });

  if (!weather) return null;

  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
          <Sparkles className="h-4 w-4" />
          <span>AI visit insight</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => refetch()}
          aria-label="Refresh AI insight"
        >
          {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
        </Button>
      </div>
      {isLoading ? (
        <div className="space-y-2">
          <div className="h-4 w-48 rounded bg-muted animate-pulse" />
          <div className="h-3 w-full rounded bg-muted animate-pulse" />
          <div className="h-3 w-5/6 rounded bg-muted animate-pulse" />
        </div>
      ) : error ? (
        <div className="text-sm text-destructive">Could not load an AI suggestion right now.</div>
      ) : (
        <div className="space-y-2 text-sm text-foreground/90">
          <p className="text-[13px] font-semibold text-foreground">{data?.headline}</p>
          <p className="leading-relaxed">{data?.tip}</p>
          <p className="text-xs text-muted-foreground">{data?.weatherNote}</p>
        </div>
      )}
    </div>
  );
}
