"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDistance } from "@/lib/distance";
import { getPlaceCategory } from "@/lib/places";
import { ScoredPlace, Weather } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useFavoritesStore } from "@/store/favorites";
import { useGeolocationStore } from "@/store/geolocation";
import Image from "next/image";
import { Bike, Bus, Car, Clock3, Footprints, Heart, MapPin, Navigation, Phone, Pin, Star } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from "./ui/drawer";
import { PlaceInsight } from "./PlaceInsight";

interface PlaceCardProps {
  place: ScoredPlace;
  rank: number;
  pinned?: boolean;
  onPinToggle?: (placeId: string) => void;
  onSwipeRemove?: (placeId: string) => void;
  weather?: Weather;
  localTime?: string;
  timezone?: string;
  originLat?: number | null;
  originLng?: number | null;
}

export function PlaceCard({ place, rank, pinned, onPinToggle, onSwipeRemove, weather, localTime, timezone, originLat, originLng }: PlaceCardProps) {
  const { toggleFavorite, isFavorite } = useFavoritesStore();
  const isFav = isFavorite(place.id);
  const [open, setOpen] = useState(false);
  const swipeStartX = useRef<number | null>(null);
  const category = getPlaceCategory(place.types);
  const openNow = place.openingHours?.openNow ?? place.isOpen;
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${place.location.lat},${place.location.lng}&query_place_id=${place.id}`;
  const userLat = useGeolocationStore((state) => state.latitude);
  const userLng = useGeolocationStore((state) => state.longitude);
  const autoLat = useGeolocationStore((state) => state.autoLatitude);
  const autoLng = useGeolocationStore((state) => state.autoLongitude);
  const originLatToUse = originLat ?? autoLat ?? userLat;
  const originLngToUse = originLng ?? autoLng ?? userLng;

  const displayTypes = place.types
    .filter((type) => !type.includes("point_of_interest"))
    .slice(0, 2)
    .map((type) => type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()));

  const hasOrigin = originLatToUse !== null && originLngToUse !== null;
  const originParam = hasOrigin ? `${originLatToUse},${originLngToUse}` : undefined;

  const directionsUrl = (mode: "walking" | "bicycling" | "driving" | "transit") => {
    const url = new URL("https://www.google.com/maps/dir/");
    url.searchParams.set("api", "1");
    url.searchParams.set("destination", `${place.location.lat},${place.location.lng}`);
    url.searchParams.set("destination_place_id", place.id);
    url.searchParams.set("travelmode", mode);
    if (originParam) {
      url.searchParams.set("origin", originParam);
    }
    return url.toString();
  };

  const commuteOptions = (distanceKm: number) => {
    const minutes = {
      walking: Math.max(2, Math.round((distanceKm / 5) * 60)),
      bicycling: Math.max(1, Math.round((distanceKm / 15) * 60)),
      driving: Math.max(1, Math.round((distanceKm / 35) * 60)),
      transit: Math.max(2, Math.round((distanceKm / 25) * 60 + 5)),
    };

    const etaText = (mins: number) => {
      const eta = new Date(Date.now() + mins * 60 * 1000);
      return eta.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    };

    return [
      { mode: "walking" as const, label: "Walk", icon: Footprints, minutes: minutes.walking },
      { mode: "bicycling" as const, label: "Bike", icon: Bike, minutes: minutes.bicycling },
      { mode: "driving" as const, label: "Drive", icon: Car, minutes: minutes.driving },
      { mode: "transit" as const, label: "Transit", icon: Bus, minutes: minutes.transit },
    ].map((opt) => ({ ...opt, eta: etaText(opt.minutes) }));
  };

  const travelOptions = commuteOptions(place.distance);

  const handleTouchStart = (event: React.TouchEvent) => {
    if (!onSwipeRemove) return;
    swipeStartX.current = event.changedTouches[0].clientX;
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    if (!onSwipeRemove || swipeStartX.current === null) return;
    const deltaX = event.changedTouches[0].clientX - swipeStartX.current;
    swipeStartX.current = null;
    if (Math.abs(deltaX) > 80) {
      onSwipeRemove(place.id);
    }
  };

  return (
    <Card
      className="pt-0 group overflow-hidden border-border/60 bg-gradient-to-b from-background to-muted/30 shadow-sm transition-all hover:-translate-y-[1px] hover:shadow-lg"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="relative h-40 overflow-hidden">
        {place.photoUrl ? (
          <Image
            src={place.photoUrl}
            alt={place.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/10 via-primary/5 to-muted" />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />

        <div className="absolute top-3 left-3 flex items-center gap-2">
          <Badge variant="secondary" className="text-[11px]">#{rank}</Badge>
          <Badge variant={openNow ? "success" : "warning"} className="text-[11px]">
            {openNow ? "Open now" : "Closed"}
          </Badge>
          {pinned && (
            <Badge variant="outline" className="text-[11px]">
              Pinned
            </Badge>
          )}
        </div>

        <div className="absolute top-3 right-3 flex items-center gap-1">
          {onPinToggle && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-transparent"
              onClick={(e) => {
                e.preventDefault();
                onPinToggle(place.id);
              }}
              aria-label={pinned ? "Unpin favorite" : "Pin favorite"}
            >
              <Pin
                className={cn(
                  "h-4 w-4 transition-colors",
                  pinned ? "text-amber-500" : "text-muted-foreground"
                )}
              />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <Link href={googleMapsUrl} target="_blank" rel="noreferrer">
              <Navigation className="h-4 w-4" />
              <span className="sr-only">Open in Maps</span>
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-transparent"
            onClick={(e) => {
              e.preventDefault();
              toggleFavorite(place.id);
            }}
            aria-label={isFav ? "Remove favorite" : "Save favorite"}
          >
            <Heart
              className={cn(
                "h-4 w-4 transition-colors",
                isFav ? "fill-red-500 text-red-500" : "text-muted-foreground"
              )}
            />
          </Button>
        </div>

        <div className="absolute bottom-3 left-3 right-3 flex flex-col gap-1">
          <h3 className="text-lg font-semibold leading-tight text-foreground line-clamp-1">
            {place.name}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-1">{place.vicinity}</p>
          {displayTypes.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {displayTypes.map((type) => (
                <Badge key={type} variant="secondary" className="px-2 py-0.5 text-[11px]">
                  {type}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      <CardContent className="space-y-3 p-4">
        <div className="flex flex-wrap items-center gap-3 text-sm text-foreground/90">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-4 w-4 text-primary" />
            {formatDistance(place.distance)}
          </span>
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <Clock3 className="h-4 w-4" />
            {openNow ? "Open now" : "Closed"}
          </span>
          {place.rating && (
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <Star className="h-4 w-4 text-yellow-500" />
              {place.rating.toFixed(1)}
            </span>
          )}
          <Badge variant="outline" className="text-[11px] capitalize">
            {category} friendly
          </Badge>
        </div>

        <p className="text-sm leading-relaxed text-muted-foreground line-clamp-3">
          {place.explanation}
        </p>

        <Drawer open={open} onOpenChange={setOpen}>
          <div className="flex flex-wrap items-center gap-2">
            <DrawerTrigger asChild>
              <Button variant="secondary" size="sm">
                Details
              </Button>
            </DrawerTrigger>
            <Button variant="outline" size="sm" asChild>
              <Link href={googleMapsUrl} target="_blank" rel="noreferrer">
                Open in Maps
              </Link>
            </Button>
            {place.menuUrl && (
              <Button variant="secondary" size="sm" asChild>
                <Link href={place.menuUrl} target="_blank" rel="noreferrer">
                  View menu
                </Link>
              </Button>
            )}
          </div>

          <DrawerContent className="sm:left-1/2 sm:max-w-xl mx-auto">
            <DrawerHeader className="gap-2 text-left">
              <DrawerTitle className="text-lg">{place.name}</DrawerTitle>
              <DrawerDescription className="text-sm text-muted-foreground">{place.vicinity}</DrawerDescription>
            </DrawerHeader>

            <div className="space-y-4 px-4 pb-4 text-sm">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span>{formatDistance(place.distance)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock3 className="h-4 w-4 text-primary" />
                  <span>{openNow ? "Open now" : "Closed"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-primary" />
                  <span>{place.rating ? `${place.rating.toFixed(1)} / 5` : "No ratings"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize">
                    {category} friendly
                  </Badge>
                </div>
                {place.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary" />
                    <a href={`tel:${place.phone}`} className="text-sm text-primary underline underline-offset-4">
                      {place.phone}
                    </a>
                  </div>
                )}
              </div>

          {displayTypes.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {displayTypes.map((type) => (
                    <Badge key={type} variant="secondary" className="px-2 py-0.5 text-[11px]">
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-sm leading-relaxed text-foreground/90">
                {place.explanation}
              </div>

              <PlaceInsight
                place={place}
                weather={weather}
                localTime={localTime}
                timezone={timezone}
              />

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Directions</p>
                {!hasOrigin && (
                  <p className="text-xs text-muted-foreground">Enable location for precise ETAs; times shown are estimates.</p>
                )}
                <div className="grid gap-2 sm:grid-cols-2">
                  {travelOptions.map((option) => (
                    <Link
                      key={option.mode}
                      href={directionsUrl(option.mode)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 rounded-lg border border-border/60 bg-background/70 p-3 text-left transition hover:border-primary"
                    >
                      <option.icon className="h-4 w-4 text-primary" />
                      <div className="text-sm leading-tight">
                        <div className="font-semibold">{option.label} · {option.minutes} min</div>
                        <div className="text-xs text-muted-foreground">ETA {option.eta}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      </CardContent>
    </Card>
  );
}
