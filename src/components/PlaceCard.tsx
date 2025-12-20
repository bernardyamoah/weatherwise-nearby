"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatDistance } from "@/lib/distance";
import { ScoredPlace } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useFavoritesStore } from "@/store/favorites";
import { Heart, MapPin, Star } from "lucide-react";
import { AudioPlayer } from "./AudioPlayer";

interface PlaceCardProps {
  place: ScoredPlace;
  rank: number;
}

export function PlaceCard({ place, rank }: PlaceCardProps) {
  const { toggleFavorite, isFavorite } = useFavoritesStore();
  const isFav = isFavorite(place.id);

  const speechText = `${place.name}. ${formatDistance(place.distance)} away. ${place.isOpen ? "Open now." : "Currently closed."} ${place.explanation}`;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all group border-muted/40">
      <CardHeader className="flex flex-row items-center justify-between p-3 bg-muted/30">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-xs font-bold text-primary">
            {rank}
          </span>
          <Badge variant={place.isOpen ? "success" : "warning"} className="text-[10px] h-5">
            {place.isOpen ? "Open" : "Closed"}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <AudioPlayer text={speechText} />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-transparent"
            onClick={(e) => {
              e.preventDefault();
              toggleFavorite(place.id);
            }}
          >
            <Heart
              className={cn(
                "w-4 h-4 transition-colors",
                isFav ? "fill-red-500 text-red-500" : "text-muted-foreground"
              )}
            />
          </Button>
        </div>
      </CardHeader>

      {place.photoUrl && (
        <div className="aspect-video overflow-hidden relative">
          <img
            src={place.photoUrl}
            alt={place.name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {place.rating && place.rating >= 4.5 && (
            <div className="absolute top-2 left-2">
               <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm text-[10px]">
                 Top Rated
               </Badge>
            </div>
          )}
        </div>
      )}

      <CardContent className="p-4 space-y-3">
        <div>
          <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">
            {place.name}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
            {place.vicinity}
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-primary" />
            {formatDistance(place.distance)}
          </span>
          {place.rating && (
            <span className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
              {place.rating.toFixed(1)}
            </span>
          )}
        </div>

        <div className="bg-primary/5 rounded-lg p-3 border border-primary/10">
          <p className="text-sm text-foreground/90 leading-relaxed italic">
            &quot;{place.explanation}&quot;
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
