"use client"

import { LocationOnboarding } from "@/components/LocationOnboarding"
import { PlaceCard } from "@/components/PlaceCard"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useDiscoveryQuery } from "@/hooks/useDiscoveryQuery"
import { useGeolocation } from "@/hooks/useGeolocation"
import { getPlaceCategory } from "@/lib/places"
import { useFavoritesStore } from "@/store/favorites"
import { Heart, MapPin, Wand2 } from "lucide-react"
import { useCallback, useMemo, useState } from "react"

export default function FavoritesPage() {
  const geo = useGeolocation()
  const { favorites, toggleFavorite, togglePin, isPinned } = useFavoritesStore()
  const [sortBy, setSortBy] = useState<"name" | "temperature">("name")
  const [locationDialogOpen, setLocationDialogOpen] = useState(false)

  const { data, isLoading, error } = useDiscoveryQuery(
    geo.latitude,
    geo.longitude
  )

  const locationReady = geo.latitude !== null && geo.longitude !== null
  const offline = typeof navigator !== "undefined" && !navigator.onLine

  const favoritePlaces = useMemo(
    () => data?.recommendations.filter((place) => favorites.includes(place.id)) || [],
    [data?.recommendations, favorites]
  )

  const temperatureSuitability = useCallback((placeId: string) => {
    const place = favoritePlaces.find((p) => p.id === placeId)
    const weatherCategory = data?.weather?.category
    if (!place || !weatherCategory) return 0

    const category = getPlaceCategory(place.types)
    if (weatherCategory === "hot" || weatherCategory === "cold") {
      return category === "indoor" ? 2 : category === "mixed" ? 1 : 0
    }
    if (weatherCategory === "rainy") {
      return category === "indoor" ? 2 : category === "mixed" ? 1 : 0
    }
    return category === "outdoor" ? 2 : category === "mixed" ? 1 : 0
  }, [data?.weather?.category, favoritePlaces])

  const sortedPlaces = useMemo(() => {
    const sorted = [...favoritePlaces]
    sorted.sort((a, b) => {
      const pinnedA = isPinned(a.id)
      const pinnedB = isPinned(b.id)
      if (pinnedA !== pinnedB) return pinnedA ? -1 : 1

      if (sortBy === "name") {
        return a.name.localeCompare(b.name)
      }

      const tempScoreDiff = temperatureSuitability(b.id) - temperatureSuitability(a.id)
      if (tempScoreDiff !== 0) return tempScoreDiff
      return a.name.localeCompare(b.name)
    })
    return sorted
  }, [favoritePlaces, isPinned, sortBy, temperatureSuitability])

  if (!locationReady) {
    return (
      <main id="main-content" className="p-6 space-y-6 max-w-5xl mx-auto">
        <Card className="border-muted/60 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Location needed</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground">Set your location to see saved spots nearby.</p>
          </CardHeader>
          <CardContent>
            <Dialog open={locationDialogOpen} onOpenChange={setLocationDialogOpen}>
              <DialogTrigger asChild>
                <button className="inline-flex items-center gap-2 rounded-md border border-border/70 bg-background px-4 py-2 text-sm font-medium hover:border-primary">
                  <MapPin className="h-4 w-4" />
                  Choose location
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Update your location</DialogTitle>
                </DialogHeader>
                <LocationOnboarding geo={geo} />
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </main>
    )
  }

  if (isLoading) {
    return (
      <main id="main-content" className="p-6 space-y-6 max-w-5xl mx-auto">
        <LocationOnboarding geo={geo} compact />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-64 w-full rounded-xl" />
          ))}
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main id="main-content" className="p-6 space-y-4 max-w-5xl mx-auto">
        <LocationOnboarding geo={geo} compact />
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="p-4 text-sm text-destructive">
            {offline ? "You appear to be offline. Reconnect and try again." : `Failed to load favorites: ${error.message}`}
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main id="main-content" className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col gap-4">
        <Card className="border-muted/60 shadow-sm">
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                <p className="text-sm font-semibold">Location in use</p>
              </div>
              <p className="text-xs text-muted-foreground">
                {geo.source === "manual" ? "Using searched location" : "Using your current location"} · {geo.latitude?.toFixed(3)}, {geo.longitude?.toFixed(3)}
              </p>
            </div>
            <Dialog open={locationDialogOpen} onOpenChange={setLocationDialogOpen}>
              <DialogTrigger asChild>
                <button className="inline-flex items-center gap-2 rounded-md border border-border/70 bg-background px-3 py-2 text-sm font-medium hover:border-primary">
                  <MapPin className="h-4 w-4" />
                  Update location
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Update your location</DialogTitle>
                </DialogHeader>
                <LocationOnboarding geo={geo} />
              </DialogContent>
            </Dialog>
          </CardHeader>
        </Card>

        <Card className="border-muted/60 shadow-sm">
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Heart className="w-6 h-6 text-red-500 fill-red-500" />
              <CardTitle className="text-xl">Your Favorites</CardTitle>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="secondary">{sortedPlaces.length} saved</Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Wand2 className="h-3.5 w-3.5" />
                {data?.weather?.description || "Current weather"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-muted-foreground">
              Swipe a card on mobile to remove, or tap the pin to keep it on top.
            </div>
            <div className="flex items-center gap-2">
              <Select value={sortBy} onValueChange={(value: "name" | "temperature") => setSortBy(value)}>
                <SelectTrigger className="w-48" aria-label="Sort favorites">
                  <SelectValue placeholder="Sort favorites" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name (A-Z)</SelectItem>
                  <SelectItem value="temperature">Temperature fit</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {sortedPlaces.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyTitle>No favorites yet</EmptyTitle>
            <EmptyDescription>
              Tap the heart on a place to save it for quick access.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sortedPlaces.map((place, index) => (
            <PlaceCard
              key={place.id}
              place={place}
              rank={index + 1}
              pinned={isPinned(place.id)}
              onPinToggle={togglePin}
              onSwipeRemove={toggleFavorite}
              weather={data?.weather}
              localTime={data?.localTime}
              timezone={data?.timezone}
              originLat={geo.autoLatitude ?? geo.latitude}
              originLng={geo.autoLongitude ?? geo.longitude}
            />
          ))}
        </div>
      )}
    </main>
  )
}
