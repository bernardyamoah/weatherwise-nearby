"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { formatDistance } from "@/lib/distance";
import { getPlaceCategory } from "@/lib/places";
import { ScoredPlace } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useFavoritesStore } from "@/store/favorites";
import {
  AudioLines,
  Clock3,
  ExternalLink,
  Heart,
  MapPin,
  Navigation,
  Sparkles,
  Star,
  Tag,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { AudioPlayer } from "./AudioPlayer";

interface PlaceCardProps {
  place: ScoredPlace;
  rank: number;
}

export function PlaceCard({ place, rank }: PlaceCardProps) {
  const { toggleFavorite, isFavorite } = useFavoritesStore();
  const isFav = isFavorite(place.id);
  const [open, setOpen] = useState(false);
  const category = getPlaceCategory(place.types);
  const openNow = place.openingHours?.openNow ?? place.isOpen;
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${place.location.lat},${place.location.lng}&query_place_id=${place.id}`;
  const walkingMinutes = Math.max(1, Math.round((place.distance * 1000) / 80));
  const matchScore = Math.min(100, Math.max(0, place.score ?? 0));

  const displayTypes = place.types
    .filter((type) => !type.includes("point_of_interest"))
    .slice(0, 4)
    .map((type) => type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()));

  const relatedQueries = useMemo(() => {
    const tags = displayTypes.length > 0 ? displayTypes : ["Cafe", "Park", "Museum"];
    return tags.slice(0, 3).map((label) => ({
      label,
      href: `/?q=${encodeURIComponent(label.toLowerCase())}`,
    }));
  }, [displayTypes]);

  const speechText = `${place.name}. ${formatDistance(place.distance)} away. ${place.isOpen ? "Open now." : "Currently closed."} ${place.explanation}`;

  const stats = [
    {
      icon: MapPin,
      label: "Distance",
      value: formatDistance(place.distance),
      hint: `${walkingMinutes} min walk`,
    },
    {
      icon: Clock3,
      label: "Status",
      value: openNow ? "Open now" : "Closed",
      hint:
        place.openingHours?.openNow === undefined
          ? "Based on recommendation"
          : "Live from Google",
    },
    {
      icon: Star,
      label: "Rating",
      value: place.rating ? `${place.rating.toFixed(1)} / 5` : "New",
      hint: place.rating ? "Google rating" : "Not yet rated",
    },
    {
      icon: Sparkles,
      label: "Category",
      value: `${category} friendly`,
      hint: displayTypes[0] || "Nearby favorite",
    },
  ];

  return (
    <Card className="group overflow-hidden border-border/60 bg-gradient-to-b from-background to-muted/30 shadow-sm transition-all hover:-translate-y-[1px] hover:shadow-lg pt-0">
      <div className="relative h-48">
        {place.photoUrl ? (
          <img
            src={place.photoUrl}
            alt={place.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/10 via-primary/5 to-muted" />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-background/85 via-background/40 to-transparent" />

        <div className="absolute top-3 left-3 flex items-center gap-2">
          <Badge variant="secondary" className="text-[11px]">#{rank}</Badge>
          <Badge variant={openNow ? "success" : "warning"} className="text-[11px]">
            {openNow ? "Open now" : "Closed"}
          </Badge>
          {place.rating && place.rating >= 4.5 && (
            <Badge variant="secondary" className="bg-background/80 text-[11px] backdrop-blur">
              Top rated
            </Badge>
          )}
        </div>

        <div className="absolute top-3 right-3 flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <Link href={googleMapsUrl} target="_blank" rel="noreferrer">
              <Navigation className="h-4 w-4" />
              <span className="sr-only">Open in Maps</span>
            </Link>
          </Button>
          <AudioPlayer text={speechText} />
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

        <div className="absolute bottom-3 left-3 right-3 flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <h3 className="text-lg font-semibold leading-tight text-foreground line-clamp-1">
              {place.name}
            </h3>
            <p className="text-xs text-muted-foreground line-clamp-1">{place.vicinity}</p>
            {displayTypes.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {displayTypes.slice(0, 3).map((type) => (
                  <Badge key={type} variant="secondary" className="px-2 py-0.5 text-[11px]">
                    <Tag className="mr-1 h-3 w-3" />
                    {type}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <Badge variant="outline" className="bg-background/80 text-[11px] backdrop-blur">
            Score {matchScore}
          </Badge>
        </div>
      </div>

      <CardContent className="space-y-4 p-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex items-start gap-2 rounded-lg border border-border/60 bg-background/70 p-3"
            >
              <stat.icon className="mt-0.5 h-4 w-4 text-primary" />
              <div className="space-y-1">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {stat.label}
                </div>
                <div className="font-medium leading-tight">{stat.value}</div>
                {stat.hint && (
                  <div className="text-[11px] text-muted-foreground">{stat.hint}</div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] uppercase tracking-wide text-muted-foreground">
            <span>Match score</span>
            <span>{matchScore}/100</span>
          </div>
          <Progress value={matchScore} className="h-2" />
        </div>

        <div className="rounded-lg border border-primary/10 bg-primary/5 p-3">
          <p className="text-sm leading-relaxed text-foreground/90 italic">
            &quot;{place.explanation}&quot;
          </p>
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <div className="flex flex-wrap items-center gap-2">
            <SheetTrigger asChild>
              <Button variant="secondary" size="sm">
                Quick details
              </Button>
            </SheetTrigger>
            <Button variant="outline" size="sm" asChild>
              <Link href={googleMapsUrl} target="_blank" rel="noreferrer">
                View on Maps
              </Link>
            </Button>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <AudioLines className="h-3.5 w-3.5" />
              Voice summary ready
            </span>
          </div>

          <SheetContent
            side="bottom"
            className="rounded-t-xl sm:left-1/2 sm:max-w-2xl sm:-translate-x-1/2"
          >
            <SheetHeader className="gap-2">
              <SheetTitle className="text-lg">{place.name}</SheetTitle>
              <SheetDescription className="flex flex-col gap-2 text-sm text-foreground/80">
                <span>{place.vicinity}</span>
                <span className="text-muted-foreground">{place.explanation}</span>
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-4 px-4 pb-4 text-sm">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="flex items-center gap-2">
                  <Navigation className="h-4 w-4 text-primary" />
                  <span>
                    {formatDistance(place.distance)} • {walkingMinutes} min walk
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock3 className="h-4 w-4 text-primary" />
                  <span>{openNow ? "Open now" : "Closed"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="capitalize">{category} friendly</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-primary" />
                  <span>Relevance score: {matchScore}</span>
                </div>
              </div>

              {displayTypes.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Highlights
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {displayTypes.map((type) => (
                      <Badge key={type} variant="secondary" className="px-2 py-0.5 text-[11px]">
                        <Tag className="mr-1 h-3 w-3" />
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  See also
                </h4>
                <div className="flex flex-wrap gap-2">
                  {relatedQueries.map((query) => (
                    <Button key={query.label} variant="outline" size="sm" asChild>
                      <Link href={query.href} onClick={() => setOpen(false)}>
                        {query.label}
                      </Link>
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <AudioLines className="h-4 w-4" />
                  <span>Listen to a quick summary</span>
                </div>
                <Button variant="link" className="px-0" asChild>
                  <Link href={googleMapsUrl} target="_blank" rel="noreferrer">
                    Open in Maps
                    <ExternalLink className="ml-1 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </CardContent>
    </Card>
  );
}
