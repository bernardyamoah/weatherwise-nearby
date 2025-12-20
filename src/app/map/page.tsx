"use client"

import { MapView } from "@/components/map-view"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useDiscoveryQuery } from "@/hooks/useDiscoveryQuery"
import { useGeolocation } from "@/hooks/useGeolocation"
import { AlertCircle } from "lucide-react"
import { useQueryState } from "nuqs"

export default function MapPage() {
  const geo = useGeolocation()
  const [search] = useQueryState("q")
  
  // Update: useDiscoveryQuery needs to be updated to accept query
  const { data, isLoading, error } = useDiscoveryQuery(
    geo.latitude,
    geo.longitude,
    search
  )

  if (geo.loading || isLoading) {
    return (
      <div className="p-6 h-[calc(100vh-60px)]">
        <Skeleton className="w-full h-full rounded-xl" />
      </div>
    )
  }

  if (geo.error || error) {
    return (
      <div className="p-6">
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="flex items-center gap-4 p-6">
            <AlertCircle className="w-6 h-6 text-destructive" />
            <div>
              <h2 className="font-semibold text-destructive">Error</h2>
              <p className="text-sm text-destructive-foreground">
                {geo.error || error?.message || "Something went wrong"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!geo.latitude || !geo.longitude) return null

  return (
    <div className="p-6 h-[calc(100vh-60px)] flex flex-col gap-6">
      <div className="flex-1">
        <MapView 
          center={{ lat: geo.latitude, lng: geo.longitude }} 
          places={data?.recommendations || []} 
        />
      </div>
    </div>
  )
}
