"use client"

import { PlaceCard } from "@/components/PlaceCard"
import { LocationOnboarding } from "@/components/LocationOnboarding"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useDiscoveryQuery } from "@/hooks/useDiscoveryQuery"
import { useGeolocation } from "@/hooks/useGeolocation"
import { useMemo } from "react"

export default function HotelsPage() {
  const geo = useGeolocation()
  const { data, isLoading, error } = useDiscoveryQuery(geo.latitude, geo.longitude, "hotel")

  const locationReady = geo.latitude !== null && geo.longitude !== null
  const hotels = useMemo(
    () => data?.recommendations.filter((p) => p.types.includes("lodging") || p.types.includes("hotel")) || [],
    [data?.recommendations]
  )

  if (!locationReady) {
    return (
      <main id="main-content" className="p-6 space-y-6 max-w-5xl mx-auto">
        <LocationOnboarding geo={geo} />
        <Card className="border-dashed">
          <CardContent className="p-6 text-sm text-muted-foreground">
            Set your location to see hotels nearby.
          </CardContent>
        </Card>
      </main>
    )
  }

  if (isLoading) {
    return (
      <main id="main-content" className="p-6 space-y-6 max-w-5xl mx-auto">
        <LocationOnboarding geo={geo} compact />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
            Failed to load hotels: {error.message}
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main id="main-content" className="p-6 space-y-6 max-w-5xl mx-auto">
      <LocationOnboarding geo={geo} compact />
      <Card className="border-muted/60 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">Hotels nearby</CardTitle>
        </CardHeader>
      </Card>

      {hotels.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-6 text-sm text-muted-foreground text-center">
            No hotels found nearby. Try adjusting your location.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {hotels.map((place, index) => (
            <PlaceCard
              key={place.id}
              place={place}
              rank={index + 1}
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
