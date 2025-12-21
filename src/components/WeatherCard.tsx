"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Weather } from "@/lib/types";
import { Moon, Sun, Sunrise, Sunset } from "lucide-react";
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

  const hour = localDate.getHours();
  const timeOfDay = (() => {
    if (hour >= 5 && hour < 11) return { label: "Morning", icon: Sunrise };
    if (hour >= 11 && hour < 17) return { label: "Afternoon", icon: Sun };
    if (hour >= 17 && hour < 21) return { label: "Evening", icon: Sunset };
    return { label: "Night", icon: Moon };
  })();

  const timeColors: Record<typeof timeOfDay["label"], string> = {
    Morning: "from-amber-500/30 via-orange-500/20 to-transparent",
    Afternoon: "from-sky-400/25 via-cyan-400/15 to-transparent",
    Evening: "from-purple-500/25 via-pink-500/20 to-transparent",
    Night: "from-indigo-700/30 via-slate-800/30 to-transparent",
  };

  const timeAccent = timeColors[timeOfDay.label];

  const categoryStyles: Record<Weather["category"], { bg: string; accent: string; badge: string; darkBg: string; darkAccent: string; darkBadge: string }> = {
    rainy: {
      bg: "from-blue-50 via-slate-50 to-white border-blue-200/60",
      accent: "text-blue-900",
      badge: "bg-blue-100 text-blue-900 border-blue-200",
      darkBg: "from-blue-900/80 via-slate-900/60 to-slate-950/80 border-blue-500/40",
      darkAccent: "text-blue-100",
      darkBadge: "bg-blue-500/20 text-blue-100 border-blue-400/60",
    },
    hot: {
      bg: "from-orange-50 via-amber-50 to-white border-orange-200/60",
      accent: "text-orange-900",
      badge: "bg-orange-100 text-orange-900 border-orange-200",
      darkBg: "from-orange-900/80 via-amber-900/50 to-slate-950/80 border-orange-500/40",
      darkAccent: "text-orange-50",
      darkBadge: "bg-orange-500/20 text-orange-50 border-orange-400/60",
    },
    cold: {
      bg: "from-cyan-50 via-slate-50 to-white border-cyan-200/60",
      accent: "text-cyan-900",
      badge: "bg-cyan-100 text-cyan-900 border-cyan-200",
      darkBg: "from-cyan-900/80 via-slate-900/60 to-slate-950/80 border-cyan-500/40",
      darkAccent: "text-cyan-50",
      darkBadge: "bg-cyan-500/20 text-cyan-50 border-cyan-400/60",
    },
    clear: {
      bg: "from-emerald-50 via-slate-50 to-white border-emerald-200/60",
      accent: "text-emerald-900",
      badge: "bg-emerald-100 text-emerald-900 border-emerald-200",
      darkBg: "from-emerald-900/80 via-slate-900/60 to-slate-950/80 border-emerald-500/40",
      darkAccent: "text-emerald-50",
      darkBadge: "bg-emerald-500/20 text-emerald-50 border-emerald-400/60",
    },
  };

  const theme = categoryStyles[weather.category];

  return (
    <Card
      className={`relative mb-6 overflow-hidden border-2 bg-gradient-to-br ${theme.bg} dark:${theme.darkBg}`}
    >
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${timeColors[timeOfDay.label]}`} />
      <CardContent className="relative flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
        <div className="relative flex items-center gap-4">
          <div
            className={`relative flex-shrink-0 overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-br p-3 backdrop-blur ${timeAccent}`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${theme.badge} opacity-40 dark:${theme.darkBadge}`} />
            <Image
              src={`/icons/${weather.icon}.png`}
              alt={weather.description}
              width={80}
              height={80}
              priority
              className="relative drop-shadow-[0_12px_24px_rgba(0,0,0,0.35)]"
            />
          </div>
          <div>
            <div className={`text-4xl font-bold leading-none $`}>
              {weather.temperature}°C
            </div>
            <div className="text-muted-foreground capitalize">{weather.description}</div>
            <div className="text-xs text-muted-foreground/80">{timeString}</div>
            <div className="flex flex-wrap gap-2 pt-2">
              <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${theme.badge} dark:${theme.darkBadge}`}>
                <timeOfDay.icon className="h-3.5 w-3.5" />
                {timeOfDay.label}
              </div>
              <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${theme.badge} dark:${theme.darkBadge}`}>
                Current • {weather.condition}
              </div>
            </div>
          </div>
        </div>

  
      </CardContent>
    </Card>
  );
}
