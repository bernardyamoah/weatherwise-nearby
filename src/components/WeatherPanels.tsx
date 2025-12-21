"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Weather } from "@/lib/types";
import {
  CalendarDays,
  Clock3,
  Cloud,
  CloudRain,
  Droplets,
  Eye,
  Gauge,
  ThermometerSun,
  Wind
} from "lucide-react";
import Image from "next/image";
import { useCallback } from "react";

interface WeatherPanelsProps {
  weather: Weather;
  localTime: string;
  timezone: string;
}

function formatHour(time: string, timezone: string) {
  return new Date(time).toLocaleTimeString("en-US", {
    hour: "numeric",
    timeZone: timezone,
  });
}

export function WeatherPanels({ weather, localTime, timezone }: WeatherPanelsProps) {
  const current = weather.current;

  const convertTemp = useCallback(
    (value?: number | null) => {
      if (value === undefined || value === null || Number.isNaN(value)) return null;
      return Math.round(value);
    },
    []
  );

  const hourly = weather.hourly;
  const daily = weather.daily;

  const hourlyItems = (hourly?.time || [])
    .slice(0, 8)
    .map((time, index) => ({
      time,
      temperature: Math.round(hourly?.temperature2m[index] ?? 0),
      precipitation: hourly?.precipitationProbability[index] ?? 0,
    }));

  const dailyCards = (daily?.time || []).map((time, i) => {
    const date = new Date(time);
    return {
      key: time,
      label: i === 0 ? "Today" : date.toLocaleDateString("en-US", { weekday: "short" }),
      dateText: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      icon: daily?.weatherCode?.[i],
      high: convertTemp(daily?.temperature2mMax?.[i]),
      low: convertTemp(daily?.temperature2mMin?.[i]),
      precipitation: hourly?.precipitationProbability?.[i] ?? null,
    };
  });

  const metrics = [
    {
      label: "Feels like",
      value: `${current?.apparentTemperature ?? weather.temperature}°`,
      hint: `Actual ${weather.temperature}°C`,
      icon: ThermometerSun,
      gradient: "from-orange-500/20 to-red-500/20"
    },
    {
      label: "Humidity",
      value: `${current?.relativeHumidity2m ?? 0}%`,
      hint: "Comfort range",
      icon: Droplets,
      gradient: "from-blue-500/20 to-cyan-500/20"
    },
    {
      label: "Wind",
      value: `${current?.windSpeed10m ?? 0} km/h`,
      hint: "10m wind speed",
      icon: Wind,
      gradient: "from-sky-500/20 to-blue-500/20"
    },
    {
      label: "Pressure",
      value: current?.pressureHpa ? `${current.pressureHpa} hPa` : "—",
      hint: "Surface pressure",
      icon: Gauge,
      gradient: "from-purple-500/20 to-pink-500/20"
    },
    {
      label: "Visibility",
      value: current?.visibilityKm ? `${current.visibilityKm} km` : "—",
      hint: "Lower in fog or rain",
      icon: Eye,
      gradient: "from-emerald-500/20 to-teal-500/20"
    },
    {
      label: "Cloud cover",
      value: current?.cloudCover !== undefined ? `${current.cloudCover}%` : "—",
      hint: "Current sky cover",
      icon: Cloud,
      gradient: "from-slate-500/20 to-gray-500/20"
    },
    {
      label: "UV index",
      value: `${current?.uvIndex ?? 0}`,
      hint: "Midday peak",
      icon: Gauge,
      gradient: "from-yellow-500/20 to-orange-500/20"
    },
    {
      label: "Local time",
      value: new Date(localTime).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: timezone,
      }),
      hint: timezone,
      icon: Clock3,
      gradient: "from-indigo-500/20 to-violet-500/20"
    },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-1">
      {/* Current Highlights */}
      <Card className="overflow-hidden border-0 bg-gradient-to-br from-card via-card to-card shadow-xl ">
        <div className="pointer-events-none absolute inset-0 opacity-[0.015] mix-blend-overlay" 
             style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' /%3E%3C/svg%3E\")" }} />
        
        <CardHeader className="relative pb-4">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Current Highlights
          </CardTitle>
        </CardHeader>
        
        <CardContent className="relative grid gap-3 sm:grid-cols-2">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="group relative overflow-hidden rounded-xl border border-border bg-white/5 p-4 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:border-border hover:bg-white/10"
            >
              <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${metric.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />
              
              <div className="relative flex items-start gap-3">
                <div className="rounded-lg bg-white/10 p-2 transition-transform duration-300 group-hover:scale-110">
                  <metric.icon className="h-4 w-4 text-foreground/70" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {metric.label}
                  </div>
                  <div className="text-xl font-bold leading-tight text-foreground">{metric.value}</div>
                  <div className="text-xs text-foreground/40">{metric.hint}</div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Hourly Outlook */}
      <Card className="overflow-hidden border-0 bg-gradient-to-br from-muted via-muted to-muted shadow-xl hidden">
        <div className="pointer-events-none absolute inset-0 opacity-[0.015] mix-blend-overlay" 
             style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' /%3E%3C/svg%3E\")" }} />
        
        <CardHeader className="relative pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold uppercase tracking-wider ">
              Hourly Outlook
            </CardTitle>
            <Badge className="border-white/20 bg-white/10 backdrop-blur-sm">
              <CloudRain className="mr-1 h-3 w-3" />
              Next 8h
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="relative">
          <ScrollArea className="w-full">
            {hourlyItems.length === 0 ? (
              <div className="p-2 text-sm text-muted-foreground">Hourly data unavailable.</div>
            ) : (
              <div className="grid auto-cols-[140px] grid-flow-col gap-3 pb-2">
                {hourlyItems.map((hour) => (
                  <div
                    key={hour.time}
                    className="group relative overflow-hidden rounded-xl border border-white/20 bg-white/5 p-4 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-white/20 hover:bg-white/10"
                  >
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    
                    <div className="relative space-y-2">
                      <div className="text-xs font-semibold text-muted-foreground">
                        {formatHour(hour.time, timezone)}
                      </div>
                      <div className="text-2xl font-bold text-foreground">{hour.temperature}°</div>
                      <Badge className="w-full justify-center border-blue-400/30 bg-blue-500/20 text-xs text-blue-100">
                        {hour.precipitation}% rain
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <ScrollBar orientation="horizontal" className="bg-white/10" />
          </ScrollArea>
        </CardContent>
      </Card>

      {/* 7-Day Forecast */}
      <Card className="overflow-hidden border-0 bg-gradient-to-br from-card via-card to-card shadow-xl lg:col-span-2">
        <div className="pointer-events-none absolute inset-0 opacity-[0.015] mix-blend-overlay" 
             style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' /%3E%3C/svg%3E\")" }} />
        
        <CardHeader className="relative">
          <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
            <CalendarDays className="h-4 w-4" /> 7-Day Outlook
          </CardTitle>
        </CardHeader>
        
        <CardContent className="relative">
          {dailyCards.length ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {dailyCards.map((day) => (
                <div
                  key={day.key}
                  className="group relative overflow-hidden rounded-xl border border-border bg-white/5 p-4 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:border-border hover:bg-white/10"
                >
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  
                  <div className="relative space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-bold text-foreground">
                          {day.label}
                        </p>
                        <p className="text-xs text-muted-foreground">{day.dateText}</p>
                      </div>
                      <Image 
                        src={`/icons/${day.icon}.png`} 
                        width={32} 
                        height={32} 
                        alt="weather"
                        className="drop-shadow-lg"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-foreground">{day.high ?? "-"}°</span>
                      <span className="text-xl text-foreground/40">{day.low ?? "-"}°</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Daily forecast unavailable.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
