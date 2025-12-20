"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Weather } from "@/lib/types";
import {
  Clock3,
  CloudRain,
  Droplets,
  Gauge,
  ThermometerSun,
  Wind
} from "lucide-react";

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

function formatDay(date: string, timezone: string) {
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "short",
    timeZone: timezone,
  });
}

export function WeatherPanels({ weather, localTime, timezone }: WeatherPanelsProps) {
  const current = weather.current;

  const hourlyItems = (weather.hourly?.time || [])
    .slice(0, 8)
    .map((time, index) => ({
      time,
      temperature: Math.round(weather.hourly?.temperature2m[index] ?? 0),
      precipitation: weather.hourly?.precipitationProbability[index] ?? 0,
    }));




  const metrics = [
    {
      label: "Feels like",
      value: `${current?.apparentTemperature ?? weather.temperature}°C`,
      hint: `Actual ${weather.temperature}°C`,
      icon: ThermometerSun,
    },
    {
      label: "Humidity",
      value: `${current?.relativeHumidity2m ?? 0}%`,
      hint: "Comfort range",
      icon: Droplets,
    },
    {
      label: "Wind",
      value: `${current?.windSpeed10m ?? 0} km/h`,
      hint: "10m wind speed",
      icon: Wind,
    },
    {
      label: "UV index",
      value: `${current?.uvIndex ?? 0}`,
      hint: "Midday peak",
      icon: Gauge,
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
    },
  ];

  return (

      <div className="grid gap-6 lg:grid-cols-2">
  
  <Card className="lg:col-span-1">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm uppercase tracking-wide text-muted-foreground">
            Current Highlights
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-2">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/30 p-3"
            >
              <metric.icon className="mt-0.5 h-4 w-4 text-primary" />
              <div className="space-y-1">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {metric.label}
                </div>
                <div className="text-base font-semibold leading-tight">{metric.value}</div>
                <div className="text-[11px] text-muted-foreground">{metric.hint}</div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-sm uppercase tracking-wide text-muted-foreground">
                Hourly Outlook
              </CardTitle>
              <Badge variant="outline" className="gap-1 text-[11px]">
                <CloudRain className="h-3.5 w-3.5" />
                Next 8 hours
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="w-full">
              {hourlyItems.length === 0 ? (
                <div className="p-2 text-sm text-muted-foreground">Hourly data unavailable.</div>
              ) : (
                <div className="grid auto-cols-[150px] grid-flow-col gap-3 pb-2">
                  {hourlyItems.map((hour) => (
                    <div
                      key={hour.time}
                      className="flex flex-col gap-2 rounded-lg border border-border/60 bg-background/70 p-3"
                    >
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">{hour.temperature}°C</span>
                        <Badge variant="secondary" className="text-[11px]">
                          {hour.precipitation}% rain
                        </Badge>
                      </div>
                      <div className="text-sm font-medium">{formatHour(hour.time, timezone)}</div>
                    </div>
                  ))}
                </div>
              )}
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </CardContent>
        </Card>

    
      </div>

  );
}
