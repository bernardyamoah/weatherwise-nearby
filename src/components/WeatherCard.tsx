"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Weather } from "@/lib/types";
import { Droplets, Moon, Sun, Sunrise, Sunset, Wind } from "lucide-react";
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

  const categoryStyles: Record<Weather["category"], { 
    gradient: string; 
    overlay: string;
    glow: string;
  }> = {
    rainy: {
      gradient: "from-slate-900 via-blue-950 to-indigo-950",
      overlay: "from-blue-500/20 via-cyan-500/10 to-transparent",
      glow: "shadow-blue-500/50",
    },
    hot: {
      gradient: "from-orange-950 via-amber-950 to-yellow-950",
      overlay: "from-orange-500/20 via-amber-500/10 to-transparent",
      glow: "shadow-orange-500/50",
    },
    cold: {
      gradient: "from-cyan-950 via-blue-950 to-slate-950",
      overlay: "from-cyan-400/20 via-blue-400/10 to-transparent",
      glow: "shadow-cyan-500/50",
    },
    clear: {
      gradient: "from-sky-900 via-blue-900 to-indigo-900",
      overlay: "from-sky-400/20 via-blue-400/10 to-transparent",
      glow: "shadow-sky-500/50",
    },
  };

  const theme = categoryStyles[weather.category];

  return (
    <Card className={`group relative mb-6 overflow-hidden border-0 bg-gradient-to-br ${theme.gradient} shadow-2xl transition-all duration-700 hover:scale-[1.02] hover:shadow-3xl`}>
      {/* Animated background overlay */}
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${theme.overlay} opacity-0 transition-opacity duration-700 group-hover:opacity-100`} />
      
      {/* Noise texture */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.015] mix-blend-overlay" 
           style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' /%3E%3C/svg%3E\")" }} />

      <CardContent className="relative p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          {/* Left side - Main weather info */}
          <div className="flex items-center gap-6">
            {/* Weather icon with glow */}
            <div className={`relative flex-shrink-0 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}>
              <div className={`absolute inset-0 rounded-3xl bg-white/10 blur-2xl ${theme.glow} transition-all duration-500 group-hover:blur-3xl`} />
              <div className="relative rounded-3xl bg-white/5 p-4 backdrop-blur-xl border border-white/10">
                <Image
                  src={`/icons/${weather.icon}.png`}
                  alt={weather.description}
                  width={96}
                  height={96}
                  priority
                  className="relative drop-shadow-2xl"
                />
              </div>
            </div>

            {/* Temperature and description */}
            <div className="flex flex-col gap-1">
              <div className="flex items-baseline gap-2">
                <span className="text-7xl font-black tracking-tighter text-white transition-all duration-500 group-hover:scale-105">
                  {weather.temperature}
                </span>
                <span className="text-4xl font-light text-white/60">°C</span>
              </div>
              <p className="text-xl font-medium capitalize text-white/90">
                {weather.description}
              </p>
              <div className="flex items-center gap-2 text-sm text-white/50">
                <timeOfDay.icon className="h-4 w-4" />
                <span>{timeOfDay.label} • {timeString}</span>
              </div>
            </div>
          </div>

          {/* Right side - Condition badge */}
          <div className="flex flex-col items-start gap-3 sm:items-end">
            <div className="rounded-full bg-white/10 px-5 py-2 backdrop-blur-md border border-white/20 transition-all duration-300 hover:bg-white/20">
              <span className="text-sm font-semibold uppercase tracking-widest text-white">
                {weather.condition}
              </span>
            </div>
            
            {/* Additional weather metrics */}
            <div className="flex gap-3">
              <div className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 backdrop-blur-sm">
                <Droplets className="h-3.5 w-3.5 text-white/70" />
                <span className="text-xs font-medium text-white/70">85%</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 backdrop-blur-sm">
                <Wind className="h-3.5 w-3.5 text-white/70" />
                <span className="text-xs font-medium text-white/70">12 km/h</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}