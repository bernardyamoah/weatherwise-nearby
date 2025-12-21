"use client"

import { MapView } from "@/components/map-view"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { useDiscoveryQuery } from "@/hooks/useDiscoveryQuery"
import { useGeolocation } from "@/hooks/useGeolocation"
import { formatDistance } from "@/lib/distance"
import { AlertCircle, Clock3, MapPin, Navigation, Star, Thermometer, Wind } from "lucide-react"
import Link from "next/link"
import { useQueryState } from "nuqs"
import { useEffect, useMemo, useState } from "react"

export default function MapPage() {
  const geo = useGeolocation()
  const [search, setSearch] = useQueryState("q")
  const [queryInput, setQueryInput] = useState(search || "")
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null)
  const [customLocationInput, setCustomLocationInput] = useState("")

  const parsedCustomLocation = useMemo(() => {
    const parts = customLocationInput.split(",").map((p) => p.trim())
    if (parts.length === 2) {
      const lat = Number(parts[0])
      const lng = Number(parts[1])
      if (!Number.isNaN(lat) && !Number.isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return { lat, lng }
      }
    }
    return null
  }, [customLocationInput])

  const latToUse = parsedCustomLocation?.lat ?? geo.latitude
  const lngToUse = parsedCustomLocation?.lng ?? geo.longitude

  const { data, isLoading, error } = useDiscoveryQuery(
    latToUse,
    lngToUse,
    search
  )

  useEffect(() => {
    if (search !== queryInput) {
      setQueryInput(search || "")
      setSelectedPlaceId(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const locationReady = latToUse !== null && lngToUse !== null
  const weather = data?.weather
  const offline = typeof navigator !== "undefined" && !navigator.onLine

  const selectedPlace = useMemo(
    () => data?.recommendations?.find((p) => p.id === selectedPlaceId) ?? null,
    [data?.recommendations, selectedPlaceId]
  )

  if ((geo.loading && !parsedCustomLocation) || (isLoading && locationReady)) {
    return (
      <main id="main-content" className="p-6 h-[calc(100vh-60px)]">
        <Skeleton className="w-full h-full rounded-xl" />
      </main>
    )
  }

  if ((!locationReady && geo.error) || error) {
    return (
      <main id="main-content" className="p-6">
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="flex items-center gap-4 p-6">
            <AlertCircle className="w-6 h-6 text-destructive" />
            <div>
              <h2 className="font-semibold text-destructive">Error</h2>
              <p className="text-sm text-destructive-foreground">
                {offline ? "You appear to be offline. Reconnect and retry." : geo.error || error?.message || "Something went wrong"}
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    )
  }

  if (!locationReady) {
    return (
      <main id="main-content" className="p-6">
        <Card className="border-dashed">
          <CardContent className="p-6 text-sm text-muted-foreground space-y-2">
            <p>Unable to resolve a location. Enable geolocation or enter custom coordinates (lat, lng).</p>
          </CardContent>
        </Card>
      </main>
    )
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(queryInput || null)
  }

  const handleClear = () => {
    setQueryInput("")
    setSearch(null)
  }

  return (
    <main id="main-content" className="p-6 h-[calc(100vh-60px)] flex flex-col gap-4">
      <Card className="border-muted/50 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Map Explorer</CardTitle>
          <p className="text-xs text-muted-foreground">
            Search and inspect recommendations near your location.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <form className="flex flex-col gap-3" onSubmit={handleSearchSubmit}>
            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <Input
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                placeholder="Search places (e.g., cafe, park)"
                aria-label="Search nearby places"
              />
              <Button type="submit" className="whitespace-nowrap">Search</Button>
              <Button type="button" variant="ghost" onClick={handleClear}>
                Clear
              </Button>
            </div>
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="secondary">{data?.recommendations?.length ?? 0} results</Badge>
                <Separator orientation="vertical" className="hidden md:block" />
                <span>Lat: {latToUse?.toFixed(3)} | Lng: {lngToUse?.toFixed(3)}</span>
              </div>
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-2">
                <Input
                  value={customLocationInput}
                  onChange={(e) => setCustomLocationInput(e.target.value)}
                  placeholder="Custom location (lat,lng)"
                  aria-label="Custom location coordinates"
                  className="md:w-72"
                />
                <p className="text-[11px] text-muted-foreground">
                  Leave blank to use your current location.
                </p>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="flex-1 relative">
        <MapView
          center={{ lat: latToUse!, lng: lngToUse! }}
          places={data?.recommendations || []}
          selectedPlaceId={selectedPlaceId}
          weatherIcon={data?.weather.icon}
          onSelect={(place) => setSelectedPlaceId(place.id)}
        />
      </div>

      <Sheet open={!!selectedPlace} onOpenChange={(open) => !open && setSelectedPlaceId(null)}>
        <SheetContent side="bottom" className="sm:max-w-xl sm:left-1/2 sm:-translate-x-1/2 rounded-t-xl p-5">
          {selectedPlace ? (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center justify-between gap-2">
                  <span>{selectedPlace.name}</span>
                  {selectedPlace.rating && (
                    <Badge variant="outline" className="flex items-center gap-1 text-xs">
                      <Star className="h-3.5 w-3.5 text-yellow-500" />
                      {selectedPlace.rating.toFixed(1)}
                    </Badge>
                  )}
                </SheetTitle>
                <SheetDescription className="text-sm text-foreground/80">
                  {selectedPlace.vicinity}
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-3 pt-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span>{formatDistance(selectedPlace.distance)} away</span>
                </div>
                {weather && (
                  <div className="grid gap-2 sm:grid-cols-3">
                    <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 p-2">
                      <Thermometer className="h-4 w-4 text-primary" />
                      <div className="text-xs leading-tight">
                        <div className="font-semibold">{weather.temperature}°C</div>
                        <div className="text-muted-foreground">Feels like {weather.current?.apparentTemperature ?? weather.temperature}°C</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 p-2">
                      <Wind className="h-4 w-4 text-primary" />
                      <div className="text-xs leading-tight">
                        <div className="font-semibold">{weather.current?.windSpeed10m ?? 0} km/h wind</div>
                        <div className="text-muted-foreground">{weather.description}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 p-2">
                      <Clock3 className="h-4 w-4 text-primary" />
                      <div className="text-xs leading-tight">
                        <div className="font-semibold">Local time</div>
                        <div className="text-muted-foreground">{data?.localTime ? new Date(data.localTime).toLocaleTimeString() : "Now"}</div>
                      </div>
                    </div>
                  </div>
                )}
                <div className="rounded-lg border border-primary/10 bg-primary/5 p-3 text-sm leading-relaxed">
                  {selectedPlace.explanation}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Score: {selectedPlace.score}</span>
                  <Separator orientation="vertical" className="h-4" />
                  <span>{selectedPlace.isOpen ? "Open now" : "Closed"}</span>
                </div>
                <div className="flex gap-2">
                  <Button asChild className="flex-1">
                    <Link
                      href={`https://www.google.com/maps/search/?api=1&query=${selectedPlace.location.lat},${selectedPlace.location.lng}&query_place_id=${selectedPlace.id}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Navigation className="mr-2 h-4 w-4" />
                      Open in Maps
                    </Link>
                  </Button>
                  <Button variant="secondary" className="flex-1" onClick={() => setSelectedPlaceId(null)}>
                    Close
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-sm text-muted-foreground">Select a place to see details.</div>
          )}
        </SheetContent>
      </Sheet>
    </main>
  )
}
