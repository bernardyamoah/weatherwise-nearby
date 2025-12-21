'use client'
import { PlaceCard } from "@/components/PlaceCard";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { WeatherCard } from "@/components/WeatherCard";
import { useDiscoveryQuery } from "@/hooks/useDiscoveryQuery";
import { useGeolocation } from "@/hooks/useGeolocation";
import { AlertCircle } from "lucide-react";
import { useQueryState } from "nuqs";

import { WeatherBriefing } from "@/components/WeatherBriefing";

export default function Home() {
  const geo = useGeolocation();
  const [search] = useQueryState("q");
  
  const { data, isLoading: isQueryLoading, error: queryError } = useDiscoveryQuery(
    geo.latitude,
    geo.longitude,
    search
  );

  const isLoading = geo.loading || isQueryLoading;
  const error = geo.error || queryError;

  // Loading state
  if (isLoading) {
    return (
      <main className="container max-w-5xl py-6 px-4 md:px-6 space-y-6">
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 w-full rounded-xl" />
          ))}
        </div>
      </main>
    );
  }

  // Error state
  if (error) {
    return (
      <main className="container max-w-5xl py-6 px-4 md:px-6">
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
            <AlertCircle className="w-12 h-12 text-destructive" />
            <div>
              <h2 className="text-xl font-bold text-destructive">Error</h2>
              <p className="text-destructive-foreground">
                {typeof error === "string" ? error : error.message}
              </p>
            </div>
            <button className="btn-primary" onClick={geo.refresh}>
              Try Again
            </button>
          </CardContent>
        </Card>
      </main>
    );
  }

  // Empty state
  if (!data || data.recommendations.length === 0) {
    return (
      <main className="container max-w-5xl py-6 px-4 md:px-6">
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center gap-4">
          <div className="text-4xl">🔍</div>
          <h2 className="text-2xl font-bold">No places found</h2>
          <p className="text-muted-foreground">Try a different search term or check back later</p>
        </div>
      </main>
    );
  }

  const { weather, localTime, timezone, recommendations } = data;

  return (
    <main className="c py-6 px-4 md:px-6 space-y-6">
      <WeatherCard weather={weather} localTime={localTime} timezone={timezone} />

      {/* <WeatherPanels weather={weather} localTime={localTime} timezone={timezone} /> */}

      <WeatherBriefing data={data} />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Recommended for you</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {recommendations.map((place, index) => (
            <PlaceCard key={place.id} place={place} rank={index + 1} />
          ))}
        </div>
      </section>
    </main>
  );
}
