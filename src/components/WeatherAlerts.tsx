"use client"

import { AudioPlayer } from "@/components/AudioPlayer"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Weather } from "@/lib/types"
import { AlertTriangle, Flame, Snowflake, CloudRain, Wind } from "lucide-react"

interface WeatherAlertsProps {
  weather: Weather
  timezone?: string
}

interface AlertItem {
  id: string
  title: string
  message: string
  severity: "caution" | "warning"
  icon: React.ComponentType<{ className?: string }>
}

export function WeatherAlerts({ weather }: WeatherAlertsProps) {
  const alerts = buildAlerts(weather)

  if (alerts.length === 0) return null

  const voiceSummary = alerts.map((alert) => `${alert.title}. ${alert.message}`).join(" ")
  
  const severityStyles = {
    warning: {
      gradient: "from-red-950 via-orange-950 to-amber-950",
      glow: "shadow-red-500/30",
      border: "border-red-500/30",
      badge: "bg-red-500/20 text-red-100 border-red-500/50",
      iconBg: "bg-red-500/10",
      iconColor: "text-red-400"
    },
    caution: {
      gradient: "from-amber-950 via-yellow-950 to-orange-950",
      glow: "shadow-amber-500/30",
      border: "border-amber-500/30",
      badge: "bg-amber-500/20 text-amber-100 border-amber-500/50",
      iconBg: "bg-amber-500/10",
      iconColor: "text-amber-400"
    }
  }

  const primarySeverity = alerts.some(a => a.severity === "warning") ? "warning" : "caution"
  const theme = severityStyles[primarySeverity]

  return (
    <Card className={`group relative overflow-hidden border bg-gradient-to-br ${theme.gradient} ${theme.border} shadow-xl transition-all duration-500 hover:shadow-2xl`}>
      {/* Animated glow */}
      <div className={`pointer-events-none absolute inset-0 ${theme.glow} opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100`} />
      
      {/* Noise texture */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.015] mix-blend-overlay" 
           style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' /%3E%3C/svg%3E\")" }} />

      <CardHeader className="relative pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={`rounded-xl ${theme.iconBg} p-2.5 backdrop-blur-sm`}>
              <AlertTriangle className={`h-5 w-5 ${theme.iconColor}`} />
            </div>
            <div className="flex flex-col gap-1">
              <CardTitle className="text-lg font-bold text-white">Active Alerts</CardTitle>
              <p className="text-sm text-white/60">Stay informed about current conditions</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge className={`${theme.badge} border font-semibold uppercase tracking-wider backdrop-blur-sm`}>
              Live
            </Badge>
            <AudioPlayer text={voiceSummary} />
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative space-y-3 pt-0">
        {alerts.map((alert, index) => {
          const alertTheme = severityStyles[alert.severity]
          const Icon = alert.icon
          
          return (
            <div
              key={alert.id}
              className={`group/alert relative overflow-hidden rounded-xl border ${alertTheme.border} bg-black/20 p-4 backdrop-blur-sm transition-all duration-300 hover:bg-black/30 hover:scale-[1.02]`}
            >
              {/* Hover gradient */}
              <div className={`pointer-events-none absolute inset-0 bg-gradient-to-r ${alert.severity === 'warning' ? 'from-red-500/10' : 'from-amber-500/10'} to-transparent opacity-0 transition-opacity duration-300 group-hover/alert:opacity-100`} />
              
              <div className="relative flex gap-3">
                <div className={`flex-shrink-0 rounded-lg ${alertTheme.iconBg} p-2 transition-transform duration-300 group-hover/alert:scale-110`}>
                  <Icon className={`h-5 w-5 ${alertTheme.iconColor}`} />
                </div>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge className={`${alertTheme.badge} border text-xs font-bold uppercase tracking-wider`}>
                      {alert.severity === "warning" ? "Severe" : "Advisory"}
                    </Badge>
                    <h3 className="font-bold text-white">{alert.title}</h3>
                  </div>
                  <p className="text-sm leading-relaxed text-white/80">{alert.message}</p>
                </div>
              </div>
              
              {index < alerts.length - 1 && (
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

function buildAlerts(weather: Weather): AlertItem[] {
  const alerts: AlertItem[] = []
  const feelsLike = weather.current?.apparentTemperature ?? weather.temperature
  const windSpeed = weather.current?.windSpeed10m ?? 0
  const precipitationChance = weather.hourly?.precipitationProbability?.[0] ?? 0

  if (feelsLike >= 32) {
    alerts.push({
      id: "heat",
      title: "Heat advisory",
      message: "High heat detected. Stay hydrated and favor indoor, air-conditioned spots.",
      severity: "warning",
      icon: Flame,
    })
  }

  if (feelsLike <= 0) {
    alerts.push({
      id: "freeze",
      title: "Freeze risk",
      message: "Temperatures are near freezing. Bundle up and limit time outdoors.",
      severity: "warning",
      icon: Snowflake,
    })
  }

  if (weather.category === "rainy" || precipitationChance >= 70) {
    alerts.push({
      id: "rain",
      title: "Heavy rain incoming",
      message: "Pack waterproof layers and prioritize indoor recommendations until it clears.",
      severity: "caution",
      icon: CloudRain,
    })
  }

  if (windSpeed >= 40) {
    alerts.push({
      id: "wind",
      title: "Gusty winds",
      message: "Secure loose items and avoid exposed viewpoints while winds are strong.",
      severity: "caution",
      icon: Wind,
    })
  }

  return alerts
}