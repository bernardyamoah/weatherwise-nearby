"use client"

import { LocationOnboarding } from "@/components/LocationOnboarding"
import { PlaceInsight } from "@/components/PlaceInsight"
import { MapView } from "@/components/map-view"
import { PlaceCard } from "@/components/PlaceCard"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
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
import { AlertCircle, Clock3, MapPin, Navigation, Search, Sparkles, Star, Thermometer, Wind } from "lucide-react"
import Link from "next/link"
import { useQueryState } from "nuqs"
import { useEffect, useMemo, useState } from "react"

export default function MapPage() {
  const geo = useGeolocation()
  const [search, setSearch] = useQueryState("q")
  const [queryInput, setQueryInput] = useState(search || "")
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null)
  const [locationDialogOpen, setLocationDialogOpen] = useState(false)
  const quickTabs = ["coffee", "parks", "art", "family", "date night"]

  const latToUse = geo.latitude
  const lngToUse = geo.longitude

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
  const topSpot = data?.recommendations?.[0]

  const selectedPlace = useMemo(
    () => data?.recommendations?.find((p) => p.id === selectedPlaceId) ?? null,
    [data?.recommendations, selectedPlaceId]
  )

  if ((geo.loading && !locationReady) || (isLoading && locationReady)) {
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
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-foreground">Location needed</p>
                <p className="text-sm text-muted-foreground">Enable geolocation or search for a place to start exploring.</p>
              </div>
              <Dialog open={locationDialogOpen} onOpenChange={setLocationDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <MapPin className="h-4 w-4" />
                    Choose location
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Set your map location</DialogTitle>
                  </DialogHeader>
                  <LocationOnboarding geo={geo} />
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      </main>
    )
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(queryInput || null)
    setSelectedPlaceId(null)
  }

  const handleClear = () => {
    setQueryInput("")
    setSearch(null)
  }

  return (
    <main id="main-content" className="p-6 h-[calc(100vh-60px)] flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-muted/50 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-1">
                <CardTitle className="text-base font-semibold">Map Explorer</CardTitle>
                <p className="text-sm text-muted-foreground">Search nearby spots with live weather context.</p>
              </div>
              <Badge variant="outline" className="text-xs font-medium">
                {data?.recommendations?.length ?? 0} nearby
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col gap-3">
              <form className="flex flex-col gap-3" onSubmit={handleSearchSubmit}>
                <div className="flex flex-col gap-2 md:flex-row md:items-center">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={queryInput}
                      onChange={(e) => setQueryInput(e.target.value)}
                      placeholder="Search places (e.g., cafe, park)"
                      aria-label="Search nearby places"
                      className="pl-10"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button type="submit" className="whitespace-nowrap">Search</Button>
                    <Button type="button" variant="ghost" onClick={handleClear}>
                      Clear
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {quickTabs.map((tab) => (
                    <Button
                      key={tab}
                      type="button"
                      variant={search === tab ? "secondary" : "outline"}
                      size="sm"
                      className="rounded-full"
                      onClick={() => {
                        setSearch(tab)
                        setQueryInput(tab)
                        setSelectedPlaceId(null)
                      }}
                    >
                      {tab}
                    </Button>
                  ))}
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      geo.refresh()
                      setSelectedPlaceId(null)
                    }}
                    className="ml-auto"
                  >
                    Refresh location
                  </Button>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <Badge variant="secondary">Lat {latToUse?.toFixed(3)} · Lng {lngToUse?.toFixed(3)}</Badge>
                  <Badge variant="outline">{data?.weather?.description || "Weather loading"}</Badge>
                  {weather && (
                    <span className="inline-flex items-center gap-1 font-medium text-foreground">
                      <Thermometer className="h-3.5 w-3.5 text-primary" />
                      {weather.temperature}°C
                    </span>
                  )}
                  <Dialog open={locationDialogOpen} onOpenChange={setLocationDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        <MapPin className="h-4 w-4" />
                        Update location
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Choose a location</DialogTitle>
                      </DialogHeader>
                      <LocationOnboarding geo={geo} />
                    </DialogContent>
                  </Dialog>
                </div>
              </form>
            </div>
          </CardContent>
        </Card>

        {topSpot && weather && (
          <Card className="border-primary/30 bg-primary/5 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
                <Sparkles className="h-4 w-4" />
                <span>AI map spotlight</span>
              </div>
              <CardTitle className="text-base">{topSpot.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <PlaceInsight
                place={topSpot}
                weather={weather}
                localTime={data?.localTime}
                timezone={data?.timezone}
              />
            </CardContent>
          </Card>
        )}
      </div>

      <div className="flex-1 relative overflow-hidden rounded-xl border border-muted/50 bg-muted/20 h-[calc(100vh)]">
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
                <PlaceInsight
                  place={selectedPlace}
                  weather={data?.weather}
                  localTime={data?.localTime}
                  timezone={data?.timezone}
                />
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

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Nearby list</h2>
            <p className="text-sm text-muted-foreground">Browse recommendations alongside the map view.</p>
          </div>
          <Badge variant="secondary">{data?.recommendations?.length ?? 0} places</Badge>
        </div>

        {data?.recommendations?.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.recommendations.map((place, index) => (
              <PlaceCard
                key={place.id}
                place={place}
                rank={index + 1}
                weather={data.weather}
                localTime={data.localTime}
                timezone={data.timezone}
                originLat={geo.autoLatitude ?? geo.latitude}
                originLng={geo.autoLongitude ?? geo.longitude}
                onSwipeRemove={() => setSelectedPlaceId(null)}
              />
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="p-6 text-sm text-muted-foreground">
              No places found. Try another search or location.
            </CardContent>
          </Card>
        )}
      </section>
    </main>
  )
}
