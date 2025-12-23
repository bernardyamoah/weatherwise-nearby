"use client"

import { WeatherAlerts } from "@/components/WeatherAlerts"
import { WeatherCard } from "@/components/WeatherCard"
import { WeatherPanels } from "@/components/WeatherPanels"
import { WeatherPackingAdvice } from "@/components/WeatherPackingAdvice"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
} from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import { useDiscoveryQuery } from "@/hooks/useDiscoveryQuery"
import { useGeolocation } from "@/hooks/useGeolocation"
import { cn } from "@/lib/utils"
import { CalendarDays, CloudRain, Sunrise, Sunset, Wind } from "lucide-react"
import { useQueryState } from "nuqs"
import { useCallback, useState } from "react"
import { Area, Bar, CartesianGrid, ComposedChart, TooltipProps, XAxis, YAxis } from "recharts"

export default function WeatherPage() {
  const geo = useGeolocation()
  const [search] = useQueryState("q")

  const [temperatureUnit, setTemperatureUnit] = useState<"C" | "F">("C")
  const [activeParam, setActiveParam] = useState<"temperature" | "precipitation">("temperature")

  const convertTemp = useCallback(
    (value?: number | null) => {
      if (value === undefined || value === null || Number.isNaN(value)) return null
      return temperatureUnit === "C" ? Math.round(value) : Math.round((value * 9) / 5 + 32)
    },
    [temperatureUnit]
  )

  const { data, isLoading, error } = useDiscoveryQuery(
    geo.latitude,
    geo.longitude,
    search
  )

  const weather = data?.weather
  const localTime = data?.localTime ?? new Date().toISOString()
  const timezone = data?.timezone ?? "UTC"
  const hourly = weather?.hourly

  const hourlySeries = !hourly?.time
    ? []
    : hourly.time.slice(0, 24).map((time, i) => {
        const date = new Date(time)
        return {
          time,
          label: date.toLocaleTimeString("en-US", { hour: "numeric", timeZone: timezone }),
          temperature: convertTemp(hourly.temperature2m?.[i]) ?? 0,
          precipitation: hourly.precipitationProbability?.[i] ?? 0,
        }
      })

  const sunriseDate = weather?.current?.sunrise ? new Date(weather.current.sunrise) : null
  const sunsetDate = weather?.current?.sunset ? new Date(weather.current.sunset) : null
  const sunTimes = {
    sunrise: sunriseDate?.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) ?? "—",
    sunset: sunsetDate?.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) ?? "—",
    wind: weather?.current?.windSpeed10m ?? 0,
  }

  const hourlyTooltip = useCallback(
    ({ active, payload, label }: TooltipProps<number, string>) => {
      if (!active || !payload?.length) return null
      const tempEntry = payload.find((p) => p.dataKey === "temperature")
      const precipEntry = payload.find((p) => p.dataKey === "precipitation")
      return (
        <div className="rounded-md border bg-background/95 p-3 shadow-sm">
          <p className="text-sm font-semibold text-foreground">{label}</p>
          <div className="mt-2 space-y-1 text-xs text-muted-foreground">
            {tempEntry && (
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">Temperature</span>
                <span className="font-semibold text-foreground">{tempEntry.value}°{temperatureUnit}</span>
              </div>
            )}
            {precipEntry && (
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">Precipitation</span>
                <span className="font-semibold text-foreground">{precipEntry.value}%</span>
              </div>
            )}
          </div>
        </div>
      )
    },
    [temperatureUnit]
  )

  if (geo.loading || isLoading) {
    return (
      <main id="main-content" className="p-6 space-y-6 max-w-5xl mx-auto">
        <Skeleton className="h-48 w-full rounded-xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </main>
    )
  }

  if (geo.error || error || !weather) {
    return (
      <main id="main-content" className="p-6 text-center text-destructive">
        Failed to load weather data
      </main>
    )
  }

  return (
    <main id="main-content" className="p-6 space-y-6 mx-auto pb-12">
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <WeatherCard weather={weather} localTime={localTime} timezone={timezone} />
        <Card className="border-muted/60 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Today&apos;s essentials</CardTitle>
            <p className="text-xs text-muted-foreground">Sun times and wind snapshots for planning.</p>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/30 p-3">
              <Sunrise className="h-4 w-4 text-primary" />
              <div className="text-sm">
                <div className="font-semibold">Sunrise</div>
                <div className="text-muted-foreground text-xs">{sunTimes.sunrise}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/30 p-3">
              <Sunset className="h-4 w-4 text-primary" />
              <div className="text-sm">
                <div className="font-semibold">Sunset</div>
                <div className="text-muted-foreground text-xs">{sunTimes.sunset}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/30 p-3">
              <Wind className="h-4 w-4 text-primary" />
              <div className="text-sm">
                <div className="font-semibold">Wind</div>
                <div className="text-muted-foreground text-xs">{sunTimes.wind} km/h</div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/30 p-3">
              <CalendarDays className="h-4 w-4 text-primary" />
              <div className="text-sm">
                <div className="font-semibold">Local time</div>
                <div className="text-muted-foreground text-xs">{new Date(localTime).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: timezone })}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <WeatherAlerts weather={weather} />

      <WeatherPackingAdvice weather={weather} localTime={localTime} timezone={timezone} />

      <WeatherPanels weather={weather} localTime={localTime} timezone={timezone} />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CloudRain className="w-4 h-4" /> Next 24 hours
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="inline-flex h-9 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
                {(["temperature", "precipitation"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setActiveParam(p)}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-sm px-3 py-1.5 text-sm font-medium transition",
                      activeParam === p
                        ? "bg-background text-foreground shadow-sm"
                        : "hover:text-foreground"
                    )}
                    aria-pressed={activeParam === p}
                  >
                    {p === "temperature" ? "Temp" : "Precip"}
                  </button>
                ))}
              </div>
              <div className="inline-flex h-9 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
                {(["C", "F"] as const).map((unit) => (
                  <button
                    key={unit}
                    onClick={() => setTemperatureUnit(unit)}
                    className={cn(
                      "inline-flex items-center justify-center rounded-sm px-3 py-1.5 text-sm font-medium transition",
                      temperatureUnit === unit
                        ? "bg-background text-foreground shadow-sm"
                        : "hover:text-foreground"
                    )}
                    aria-pressed={temperatureUnit === unit}
                  >
                    °{unit}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {hourlySeries.length === 0 ? (
              <div className="text-sm text-muted-foreground">Hourly data unavailable.</div>
            ) : (
              <ChartContainer
                config={{
                  temperature: { label: "Temperature", color: "var(--color-chart-1)" },
                  precipitation: { label: "Precipitation", color: "var(--color-chart-2)" },
                }}
                className="h-[320px]"
              >
                <ComposedChart data={hourlySeries} margin={{ left: 12, right: 12 }}>
                  <defs>
                    <linearGradient id="fill-temperature" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-chart-1)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--color-chart-1)" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="fill-precipitation" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-chart-2)" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="var(--color-chart-2)" stopOpacity={0.08} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    interval={0}
                    minTickGap={16}
                  />
                  <YAxis
                    yAxisId="left"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    width={34}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    domain={[0, 100]}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    width={34}
                  />
                  <ChartTooltip content={hourlyTooltip} />
                  <ChartLegend content={<ChartLegendContent className="pt-2" />} />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="temperature"
                    stroke="var(--color-chart-1)"
                    fill="url(#fill-temperature)"
                    strokeWidth={2}
                    activeDot={{ r: 4 }}
                    name="temperature"
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="precipitation"
                    fill="url(#fill-precipitation)"
                    stroke="var(--color-chart-2)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={18}
                    name="precipitation"
                  />
                </ComposedChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CalendarDays className="w-4 h-4" /> 7-Day outlook
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {weather.daily?.time?.length ? (
              weather.daily.time.map((time, i) => (
                <div
                  key={time}
                  className="flex items-center justify-between text-sm rounded-lg border border-border/60 bg-muted/20 px-3 py-2"
                >
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">
                      {i === 0
                        ? "Today"
                        : new Date(time).toLocaleDateString("en-US", { weekday: "short" })}
                    </p>
                    <p className="text-[11px] text-muted-foreground/80">
                      {new Date(time).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span className="font-bold">{convertTemp(weather.daily?.temperature2mMax?.[i]) ?? "-"}°</span>
                    <span>{convertTemp(weather.daily?.temperature2mMin?.[i]) ?? "-"}°</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground">Daily forecast unavailable.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
