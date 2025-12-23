'use client'
import { LocationOnboarding } from "@/components/LocationOnboarding";
import { PlaceInsight } from "@/components/PlaceInsight";
import { PlaceCard } from "@/components/PlaceCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { WeatherAlerts } from "@/components/WeatherAlerts";
import { WeatherCard } from "@/components/WeatherCard";
import { useDiscoveryQuery } from "@/hooks/useDiscoveryQuery";
import { useGeolocation } from "@/hooks/useGeolocation";
import { AlertCircle, Map } from "lucide-react";
import Link from "next/link";
import { useQueryState } from "nuqs";

import { WeatherBriefing } from "@/components/WeatherBriefing";

export default function Home() {
  const geo = useGeolocation();
  const [search, setSearch] = useQueryState("q");
  const quickTabs = ["coffee", "parks", "art", "family", "date night"];
  const hasSearch = Boolean(search);
  
  const { data, isLoading: isQueryLoading, error: queryError } = useDiscoveryQuery(
    geo.latitude,
    geo.longitude,
    search
  );

  const locationReady = geo.latitude !== null && geo.longitude !== null;
  const isLoading = geo.loading || isQueryLoading;
  const error = geo.error || queryError;
  const offline = typeof navigator !== "undefined" && !navigator.onLine;

  if (!locationReady) {
    return (
      <main id="main-content" className="container max-w-5xl space-y-6 py-6 px-4 md:px-6 mx-auto">
        <LocationOnboarding geo={geo} />
        <Card className="border-dashed">
          <CardContent className="p-6 text-sm text-muted-foreground space-y-2">
            {geo.loading ? (
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-32" />
                <span>Waiting for location permission...</span>
              </div>
            ) : (
              <p>Set your location to load recommendations nearby.</p>
            )}
            {geo.error && <p className="text-destructive">{geo.error}</p>}
          </CardContent>
        </Card>
      </main>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <main id="main-content" className="container max-w-5xl space-y-6 py-6 px-4 md:px-6 mx-auto">
        <LocationOnboarding geo={geo} compact />
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
      <main id="main-content" className="container max-w-5xl space-y-4 py-6 px-4 md:px-6 mx-auto">
        <LocationOnboarding geo={geo} compact />
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
            <AlertCircle className="w-12 h-12 text-destructive" />
            <div>
              <h2 className="text-xl font-bold text-destructive">Error</h2>
              <p className="text-destructive-foreground">
                {offline ? "You appear to be offline. Reconnect and try again." : typeof error === "string" ? error : error.message}
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
      <main id="main-content" className="container max-w-5xl space-y-6 py-6 px-4 md:px-6">
        <LocationOnboarding geo={geo} compact />
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center">
          <div className="text-4xl">🔍</div>
          <h2 className="text-2xl font-bold">No places found</h2>
          <p className="text-muted-foreground">Try a different search term or adjust your location</p>
        </div>
      </main>
    );
  }

  const { weather, localTime, timezone, recommendations } = data;
  const topPick = recommendations[0];
  const latDisplay = (geo.autoLatitude ?? geo.latitude)?.toFixed(3);
  const lngDisplay = (geo.autoLongitude ?? geo.longitude)?.toFixed(3);
  const localTimeLabel = localTime ? new Date(localTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : null;

  return (
    <main id="main-content" className="container max-w-7xl mx-auto space-y-6 py-6 px-4 md:px-6">
      <section className="rounded-xl border border-border/70 bg-muted/20 p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">Places near you</p>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {geo.locationLabel && (
                <Badge variant="outline" className="border-primary/40 text-foreground">
                  {geo.locationLabel}
                </Badge>
              )}
              {latDisplay && lngDisplay && (
                <Badge variant="secondary">Lat {latDisplay} · Lng {lngDisplay}</Badge>
              )}
              <Badge variant="outline">{geo.source === "manual" ? "Manual location" : "Auto location"}</Badge>
              {localTimeLabel && <Badge variant="outline">Local {localTimeLabel}</Badge>}
              <Badge variant="outline">{weather.description}</Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={!hasSearch}
              onClick={() => setSearch(null)}
            >
              Clear search
            </Button>
            <Button asChild variant="outline" size="sm" className="gap-2">
              <Link href={search ? `/map?q=${encodeURIComponent(search)}` : "/map"}>
                <Map className="h-4 w-4" />
                Open map view
              </Link>
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">Quick picks</span>
          {quickTabs.map((tab) => (
            <Button
              key={tab}
              type="button"
              size="sm"
              variant={search === tab ? "secondary" : "outline"}
              className="rounded-full"
              onClick={() => setSearch(tab)}
            >
              {tab}
            </Button>
          ))}
          <Button type="button" size="sm" variant="ghost" onClick={geo.refresh} className="ml-auto">
            Refresh location
          </Button>
        </div>
      </section>
      <LocationOnboarding geo={geo} compact />
      <WeatherCard weather={weather} localTime={localTime} timezone={timezone} />
      <WeatherAlerts weather={weather} />

      <WeatherBriefing data={data} />

      {topPick && (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">AI spotlight pick</h3>
          <PlaceInsight
            place={topPick}
            weather={weather}
            localTime={localTime}
            timezone={timezone}
          />
        </section>
      )}

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Recommended for you</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {recommendations.map((place, index) => (
            <PlaceCard
              key={place.id}
              place={place}
              rank={index + 1}
              weather={weather}
              localTime={localTime}
              timezone={timezone}
              originLat={geo.autoLatitude ?? geo.latitude}
              originLng={geo.autoLongitude ?? geo.longitude}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
