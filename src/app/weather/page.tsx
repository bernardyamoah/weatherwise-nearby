"use client"

import { WeatherCard } from "@/components/WeatherCard"
import { WeatherPanels } from "@/components/WeatherPanels"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip
} from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import { useDiscoveryQuery } from "@/hooks/useDiscoveryQuery"
import { useGeolocation } from "@/hooks/useGeolocation"
import { cn } from "@/lib/utils"
import {
  AreaChart as AreaChartIcon,
  CalendarDays,
  CloudRain,
  LayoutGrid
} from "lucide-react"
import Image from "next/image"
import { useQueryState } from "nuqs"
import { useCallback, useState } from "react"
import { Area, Bar, CartesianGrid, ComposedChart, XAxis, YAxis } from "recharts"

export default function WeatherPage() {
  const geo = useGeolocation()
  const [search] = useQueryState("q")

  const [viewMode, setViewMode] = useState<"cards" | "chart">("cards")
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

  if (geo.loading || isLoading) {
    return (
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <Skeleton className="h-48 w-full rounded-xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  if (geo.error || error) {
    return <div className="p-6 text-center text-destructive">Failed to load weather data</div>
  }

  if (!data) return null

  const { weather, localTime, timezone } = data
  const current = weather.current
  const hourly = weather.hourly
  const daily = weather.daily

  const hourlySeries = (hourly?.time || []).slice(0, 24).map((time, i) => {
    const date = new Date(time)
    return {
      time,
      label: date.toLocaleTimeString("en-US", { hour: "numeric", timeZone: timezone }),
      temperature: convertTemp(hourly?.temperature2m?.[i]) ?? 0,
      precipitation: hourly?.precipitationProbability?.[i] ?? 0,
    }
  })

  const dailyCards = (daily?.time || []).map((time, i) => {
    const date = new Date(time)
    return {
      key: time,
      label: i === 0 ? "Today" : date.toLocaleDateString("en-US", { weekday: "short" }),
      dateText: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      icon: daily?.weatherCode?.[i],
      high: convertTemp(daily?.temperature2mMax?.[i]),
      low: convertTemp(daily?.temperature2mMin?.[i]),
      precipitation: hourly?.precipitationProbability?.[i] ?? null,
    }
  })

  const hourlyTooltip = useCallback(
    ({ active, payload, label }: any) => {
      if (!active || !payload?.length) return null
      const tempEntry = payload.find((p: any) => p.dataKey === "temperature")
      const precipEntry = payload.find((p: any) => p.dataKey === "precipitation")
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

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto pb-12">
      <WeatherCard weather={weather} localTime={localTime} timezone={timezone} />

      <WeatherPanels weather={weather} localTime={localTime} timezone={timezone} />

    

      <div className="grid gap-6 md:grid-cols-3">
        {/* Hourly chart */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CloudRain className="w-4 h-4" /> 24h Trend
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
                  temperature: { label: "Temperature", color: "hsl(var(--chart-1))" },
                  precipitation: { label: "Precipitation", color: "hsl(var(--chart-2))" },
                }}
                className="h-[320px]"
              >
                <ComposedChart data={hourlySeries} margin={{ left: 12, right: 12 }}>
                  <defs>
                    <linearGradient id="fill-temperature" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-temperature)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--color-temperature)" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="fill-precipitation" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-precipitation)" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="var(--color-precipitation)" stopOpacity={0.08} />
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
                    stroke="var(--color-temperature)"
                    fill="url(#fill-temperature)"
                    strokeWidth={2}
                    activeDot={{ r: 4 }}
                    name="temperature"
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="precipitation"
                    fill="url(#fill-precipitation)"
                    stroke="var(--color-precipitation)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={18}
                    name="precipitation"
                  />
                </ComposedChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* 7-Day Forecast */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CalendarDays className="w-4 h-4" /> 7-Day Forecast
            </CardTitle>
            <div className="inline-flex items-center gap-1 rounded-md bg-muted p-1 text-xs text-muted-foreground">
              {(["cards", "chart"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-sm px-3 py-1.5 font-medium transition",
                    viewMode === mode
                      ? "bg-background text-foreground shadow-sm"
                      : "hover:text-foreground"
                  )}
                  aria-pressed={viewMode === mode}
                >
                  {mode === "cards" ? <LayoutGrid className="h-3.5 w-3.5" /> : <AreaChartIcon className="h-3.5 w-3.5" />} {mode === "cards" ? "Cards" : "Chart"}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {viewMode === "cards" ? (
              dailyCards.length ? (
                dailyCards.map((day) => (
                  <div key={day.key} className="flex items-center justify-between text-sm rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground">{day.label}</p>
                      <p className="text-[11px] text-muted-foreground/80">{day.dateText}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Image src={`/icons/${day.icon}.png`} width={28} height={28} alt="weather" />
                    </div>
                    <div className="flex gap-3 w-24 justify-end">
                      <span className="font-bold">{day.high ?? "-"}°</span>
                      <span className="text-muted-foreground">{day.low ?? "-"}°</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground">Daily forecast unavailable.</div>
              )
            ) : hourlySeries.length ? (
              <ChartContainer
                config={{
                  temperature: { label: "Temp", color: "hsl(var(--chart-1))" },
                  precipitation: { label: "Precip %", color: "hsl(var(--chart-2))" },
                }}
                className="h-[260px]"
              >
                <ComposedChart data={hourlySeries.slice(0, 12)} margin={{ left: 12, right: 12 }}>
                  <defs>
                    <linearGradient id="fill-temperature-mini" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-temperature)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--color-temperature)" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="fill-precipitation-mini" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-precipitation)" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="var(--color-precipitation)" stopOpacity={0.08} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    width={34}
                  />
                  <ChartTooltip content={hourlyTooltip} />
                  <ChartLegend content={<ChartLegendContent className="pt-2" />} />
                  <Area
                    type="monotone"
                    dataKey="temperature"
                    stroke="var(--color-temperature)"
                    fill="url(#fill-temperature-mini)"
                    strokeWidth={2}
                    activeDot={{ r: 3.5 }}
                    name="temperature"
                  />
                  <Bar
                    dataKey="precipitation"
                    fill="url(#fill-precipitation-mini)"
                    stroke="var(--color-precipitation)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={18}
                    name="precipitation"
                  />
                </ComposedChart>
              </ChartContainer>
            ) : (
              <div className="text-sm text-muted-foreground">Daily forecast unavailable.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function MetricCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number }) {
  return (
    <Card className="bg-muted/20 border-muted/50">
      <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-1">
        {icon}
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</span>
        <span className="text-lg font-bold">{value}</span>
      </CardContent>
    </Card>
  )
}
