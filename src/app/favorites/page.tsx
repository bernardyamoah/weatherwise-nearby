"use client"

import { PlaceCard } from "@/components/PlaceCard"
import { useDiscoveryQuery } from "@/hooks/useDiscoveryQuery"
import { useGeolocation } from "@/hooks/useGeolocation"
import { useFavoritesStore } from "@/store/favorites"
import { Heart } from "lucide-react"

export default function FavoritesPage() {
  const geo = useGeolocation()
  const { favorites } = useFavoritesStore()
  
  const { data, isLoading } = useDiscoveryQuery(
    geo.latitude,
    geo.longitude
  )

  const favoritePlaces = data?.recommendations.filter(p => favorites.includes(p.id)) || []

  if (isLoading) {
    return <div className="p-6">Loading favorites...</div>
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-2">
        <Heart className="w-6 h-6 text-red-500 fill-red-500" />
        <h1 className="text-2xl font-bold">Your Favorites</h1>
      </div>

      {favoritePlaces.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-xl">
          <p className="text-muted-foreground">You haven&apos;t favorited any places yet.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {favoritePlaces.map((place, index) => (
            <PlaceCard key={place.id} place={place} rank={index + 1} />
          ))}
        </div>
      )}
    </div>
  )
}
