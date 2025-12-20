"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Weather } from "@/lib/types";
import Image from "next/image";
import { Droplets, Gauge, ThermometerSun, Wind } from "lucide-react";

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

  const categoryStyles: Record<Weather["category"], { bg: string; accent: string; badge: string }> = {
    rainy: {
      bg: "from-blue-900/80 via-slate-900/60 to-slate-950/80 border-blue-400/40",
      accent: "text-blue-100",
      badge: "bg-blue-500/20 text-blue-100 border-blue-400/60",
    },
    hot: {
      bg: "from-orange-900/80 via-amber-900/50 to-slate-950/80 border-orange-400/40",
      accent: "text-orange-100",
      badge: "bg-orange-500/20 text-orange-50 border-orange-400/60",
    },
    cold: {
      bg: "from-cyan-900/80 via-slate-900/60 to-slate-950/80 border-cyan-400/40",
      accent: "text-cyan-50",
      badge: "bg-cyan-500/20 text-cyan-50 border-cyan-400/60",
    },
    clear: {
      bg: "from-emerald-900/80 via-slate-900/60 to-slate-950/80 border-emerald-400/40",
      accent: "text-emerald-50",
      badge: "bg-emerald-500/20 text-emerald-50 border-emerald-400/60",
    },
  };

  const feelsLike = weather.current?.apparentTemperature ?? weather.temperature;
  const humidity = weather.current?.relativeHumidity2m;
  const wind = weather.current?.windSpeed10m;
  const uv = weather.current?.uvIndex;

  const stats = [
    { icon: ThermometerSun, label: "Feels like", value: `${feelsLike}°C` },
    humidity !== undefined
      ? { icon: Droplets, label: "Humidity", value: `${humidity}%` }
      : null,
    wind !== undefined ? { icon: Wind, label: "Wind", value: `${wind} km/h` } : null,
    uv !== undefined ? { icon: Gauge, label: "UV", value: uv } : null,
  ].filter(Boolean) as { icon: typeof ThermometerSun; label: string; value: string | number }[];

  const theme = categoryStyles[weather.category];

  return (
    <Card
      className={`mb-6 overflow-hidden border-2 bg-gradient-to-br ${theme.bg}`}
    >
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
        <div className="relative flex items-center gap-4">
          <div className={`flex-shrink-0 rounded-2xl p-3 backdrop-blur ${theme.badge}`}>
            <Image
              src={`/icons/${weather.icon}.png`}
              alt={weather.description}
              width={80}
              height={80}
              priority
              className="drop-shadow-lg"
            />
          </div>
          <div>
            <div className={`text-4xl font-bold leading-none ${theme.accent}`}>
              {weather.temperature}°C
            </div>
            <div className="text-muted-foreground capitalize">{weather.description}</div>
            <div className="text-xs text-muted-foreground/80">{timeString}</div>
            <div className={`mt-1 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${theme.badge}`}>
              Current • {weather.condition}
            </div>
          </div>
        </div>

        <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className={`flex items-center gap-2 rounded-lg bg-white/5 p-3 text-sm backdrop-blur border border-white/10 ${theme.accent}`}
            >
              <stat.icon className="h-4 w-4 text-primary" />
              <div className="leading-tight">
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  {stat.label}
                </div>
                <div className="font-semibold text-foreground">{stat.value}</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
