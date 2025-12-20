"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Weather } from "@/lib/types";
import Image from "next/image";

interface WeatherCardProps {
  weather: Weather;
  localTime: string;
  timezone: string;
}

export function WeatherCard({ weather, localTime, timezone }: WeatherCardProps) {
  const localDate = new Date(localTime);
  const timeString = localDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: timezone,
  });

  const categoryStyles: Record<string, string> = {
    rainy: "bg-gradient-to-br from-blue-900/50 to-slate-900/50 border-blue-500/30",
    hot: "bg-gradient-to-br from-orange-900/50 to-slate-900/50 border-orange-500/30",
    cold: "bg-gradient-to-br from-cyan-900/50 to-slate-900/50 border-cyan-500/30",
    clear: "bg-gradient-to-br from-green-900/50 to-slate-900/50 border-green-500/30",
  };

  return (
    <Card className={`${categoryStyles[weather.category]} mb-6`}>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex-shrink-0">
          <Image
            src={`/icons/${weather.icon}.png`}
            alt={weather.description}
            width={80}
            height={80}
            priority
            className="drop-shadow-lg"
          />
        </div>
        <div className="flex-1">
          <div className="text-3xl font-bold">{weather.temperature}°C</div>
          <div className="text-muted-foreground capitalize">{weather.description}</div>
          <div className="text-sm text-muted-foreground mt-1">{timeString}</div>
        </div>
      </CardContent>
    </Card>
  );
}
