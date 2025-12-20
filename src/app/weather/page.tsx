"use client"

import { WeatherCard } from "@/components/WeatherCard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useDiscoveryQuery } from "@/hooks/useDiscoveryQuery"
import { useGeolocation } from "@/hooks/useGeolocation"
import {
    CalendarDays,
    Clock,
    CloudRain,
    Droplets,
    Sun,
    Thermometer,
    Wind
} from "lucide-react"
import Image from "next/image"
import { useQueryState } from "nuqs"

export default function WeatherPage() {
  const geo = useGeolocation()
  const [search] = useQueryState("q")
  
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

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto pb-12">
      <WeatherCard weather={weather} localTime={localTime} timezone={timezone} />

      {/* Current Details */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard 
          icon={<Thermometer className="w-5 h-5 text-orange-500" />} 
          label="Feels Like" 
          value={`${current?.apparentTemperature || '--'}°`} 
        />
        <MetricCard 
          icon={<Droplets className="w-5 h-5 text-blue-500" />} 
          label="Humidity" 
          value={`${current?.relativeHumidity2m || '--'}%`} 
        />
        <MetricCard 
          icon={<Wind className="w-5 h-5 text-teal-500" />} 
          label="Wind Speed" 
          value={`${current?.windSpeed10m || '--'} km/h`} 
        />
        <MetricCard 
          icon={<Sun className="w-5 h-5 text-yellow-500" />} 
          label="UV Index" 
          value={current?.uvIndex || 'Low'} 
        />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Hourly Forecast */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" /> Hourly Forecast (Next 24h)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex overflow-x-auto pb-4 gap-6 scrollbar-hide">
              {hourly?.time.slice(0, 24).map((time: string, i: number) => {
                const date = new Date(time)
                const hour = date.getHours()
                return (
                  <div key={time} className="flex flex-col items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-muted-foreground">
                      {hour === 0 ? '12 AM' : hour > 12 ? `${hour - 12} PM` : `${hour} ${hour === 12 ? 'PM' : 'AM'}`}
                    </span>
                    <span className="font-bold text-sm">{Math.round(hourly.temperature2m[i])}°</span>
                    <div className="flex flex-col items-center text-[10px] text-blue-400">
                      <CloudRain className="w-3 h-3 mb-1" />
                      {hourly.precipitationProbability[i]}%
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* 7-Day Forecast */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CalendarDays className="w-4 h-4" /> 7-Day Forecast
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {daily?.time.map((time: string, i: number) => {
              const date = new Date(time)
              const day = date.toLocaleDateString('en-US', { weekday: 'short' })
              return (
                <div key={time} className="flex items-center justify-between text-sm">
                  <span className="w-10 text-muted-foreground">{i === 0 ? 'Today' : day}</span>
                  <div className="flex items-center gap-2">
                     <Image src={`/icons/${daily.weatherCode[i]}.png`} width={24} height={24} alt="weather" />
                  </div>
                  <div className="flex gap-2 w-16 justify-end">
                    <span className="font-bold">{Math.round(daily.temperature2mMax[i])}°</span>
                    <span className="text-muted-foreground">{Math.round(daily.temperature2mMin[i])}°</span>
                  </div>
                </div>
              )
            })}
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
