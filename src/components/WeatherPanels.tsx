"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Weather } from "@/lib/types";
import {
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Area,
  ComposedChart,
} from "recharts";
import {
  CalendarRange,
  CloudRain,
  Clock3,
  Droplets,
  Gauge,
  ThermometerSun,
  Wind,
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

  const dailyItems = (weather.daily?.time || [])
    .slice(0, 5)
    .map((time, index) => ({
      time,
      min: Math.round(weather.daily?.temperature2mMin[index] ?? 0),
      max: Math.round(weather.daily?.temperature2mMax[index] ?? 0),
      code: weather.daily?.weatherCode[index] ?? 0,
    }));

  const trendItems = (weather.hourly?.time || [])
    .slice(0, 12)
    .map((time, index) => ({
      time,
      label: formatHour(time, timezone),
      temperature: Math.round(weather.hourly?.temperature2m[index] ?? 0),
      apparent: Math.round(current?.apparentTemperature ?? weather.temperature),
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
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm uppercase tracking-wide text-muted-foreground">
            Current Highlights
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
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

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-sm uppercase tracking-wide text-muted-foreground">
                Weather Trends
              </CardTitle>
              <Badge variant="outline" className="gap-1 text-[11px]">
                <CloudRain className="h-3.5 w-3.5" />
                Next 12 hours
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {trendItems.length === 0 ? (
              <div className="text-sm text-muted-foreground">Trend data unavailable.</div>
            ) : (
              <ChartContainer
                config={{
                  temperature: { label: "Temp (°C)", color: "hsl(var(--chart-1))" },
                  apparent: { label: "Feels like", color: "hsl(var(--chart-2))" },
                  precipitation: { label: "Precip %", color: "hsl(var(--chart-3))" },
                }}
                className="h-[280px]"
              >
                <ComposedChart data={trendItems} margin={{ left: 12, right: 12 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    interval={0}
                    minTickGap={12}
                  />
                  <YAxis
                    yAxisId="left"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    width={32}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    domain={[0, 100]}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    width={32}
                  />
                  <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                  <ChartLegend content={<ChartLegendContent className="pt-2" />} />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="temperature"
                    stroke="var(--color-temperature)"
                    fill="var(--color-temperature)"
                    fillOpacity={0.15}
                    strokeWidth={2}
                    activeDot={{ r: 4 }}
                    name="temperature"
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="apparent"
                    stroke="var(--color-apparent)"
                    fill="var(--color-apparent)"
                    fillOpacity={0.12}
                    strokeWidth={2}
                    name="apparent"
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="precipitation"
                    fill="var(--color-precipitation)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={18}
                    name="precipitation"
                  />
                </ComposedChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
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

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-sm uppercase tracking-wide text-muted-foreground">
                5-Day Forecast
              </CardTitle>
              <Badge variant="outline" className="gap-1 text-[11px]">
                <CalendarRange className="h-3.5 w-3.5" />
                Outlook
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {dailyItems.length === 0 ? (
              <div className="text-sm text-muted-foreground">Daily forecast unavailable.</div>
            ) : (
              dailyItems.map((day) => (
                <div
                  key={day.time}
                  className="flex items-center justify-between rounded-lg border border-border/60 bg-background/70 px-3 py-2"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 overflow-hidden rounded-md bg-muted">
                      <Image
                        src={`/icons/${day.code}.png`}
                        alt="Forecast icon"
                        width={40}
                        height={40}
                      />
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{formatDay(day.time, timezone)}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(day.time).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          timeZone: timezone,
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm font-semibold">
                    {day.max}° / {day.min}°
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
