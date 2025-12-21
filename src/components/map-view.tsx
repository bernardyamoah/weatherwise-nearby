"use client"

import { ScoredPlace } from "@/lib/types";
import { useEffect, useRef } from "react";

interface MapViewProps {
  center: { lat: number; lng: number }
  places: ScoredPlace[]
  selectedPlaceId?: string | null
  onSelect?: (place: ScoredPlace) => void
  weatherIcon?: string
}

export function MapView({ center, places, selectedPlaceId, onSelect, weatherIcon }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const googleMapRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<google.maps.Marker[]>([])
  const markerLookupRef = useRef<Record<string, google.maps.Marker>>({})

  useEffect(() => {
    if (!mapRef.current) return

    const loadMap = async () => {
      if (!window.google) {
        console.error("Google Maps API not loaded")
        return
      }

      const map = new window.google.maps.Map(mapRef.current!, {
        center,
        zoom: 14,
        styles: DARK_MAP_STYLE,
        disableDefaultUI: true,
        zoomControl: true,
      })

      googleMapRef.current = map

      // Add user marker
      new window.google.maps.Marker({
        position: center,
        map,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: "#6366f1",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
        title: "Your Location",
      })
    }

    loadMap()
  }, [center])

  useEffect(() => {
    if (!googleMapRef.current) return

    // Clear existing markers
    markersRef.current.forEach((m) => m.setMap(null))
    markersRef.current = []
    markerLookupRef.current = {}

    const clusters = buildClusters(places)

    clusters.forEach((cluster, index) => {
      const marker = new window.google.maps.Marker({
        position: cluster.center,
        map: googleMapRef.current!,
        label:
          weatherIcon || cluster.items.length > 1
            ? undefined
            : {
                text: (index + 1).toString(),
                color: "white",
              },
        icon:
          weatherIcon && cluster.items.length === 1
            ? {
                url: `/icons/${weatherIcon}.png`,
                    scaledSize: new window.google.maps.Size(40, 40),
                
                anchor: new window.google.maps.Point(20, 20),
              }
            : cluster.items.length > 1
              ? {
                  path: window.google.maps.SymbolPath.CIRCLE,
                  scale: 18,
                  fillColor: "#6366f1",
                  fillOpacity: 0.85,
                  strokeColor: "#ffffff",
                  strokeWeight: 2,
                }
              : undefined,
        title:
          cluster.items.length > 1
            ? `${cluster.items.length} nearby spots`
            : cluster.items[0].name,
      })

      marker.addListener("click", () => {
        if (cluster.items.length === 1) {
          onSelect?.(cluster.items[0])
          return
        }

        const bounds = new window.google.maps.LatLngBounds()
        cluster.items.forEach((place) => {
          bounds.extend(new window.google.maps.LatLng(place.location.lat, place.location.lng))
        })
        googleMapRef.current?.fitBounds(bounds)
      })

      cluster.items.forEach((place) => {
        markerLookupRef.current[place.id] = marker
      })

      markersRef.current.push(marker)
    })
  }, [places, onSelect, weatherIcon])

  useEffect(() => {
    if (!googleMapRef.current || !selectedPlaceId) return

    const match = markerLookupRef.current[selectedPlaceId]

    if (match) {
      googleMapRef.current.panTo(match.getPosition()!)
      match.setAnimation(window.google.maps.Animation.DROP)
    }
  }, [selectedPlaceId, places])

  return (
    <div className="w-full h-full min-h-[400px] rounded-xl overflow-hidden border">
      <div ref={mapRef} className="w-full h-full" />
    </div>
  )
}

function buildClusters(places: ScoredPlace[]) {
  const clusters: { center: { lat: number; lng: number }; items: ScoredPlace[] }[] = []
  const thresholdKm = 0.35

  places.forEach((place) => {
    const existingCluster = clusters.find((cluster) => distanceKm(cluster.center, place.location) < thresholdKm)
    if (existingCluster) {
      existingCluster.items.push(place)
      const total = existingCluster.items.length
      existingCluster.center = {
        lat: (existingCluster.center.lat * (total - 1) + place.location.lat) / total,
        lng: (existingCluster.center.lng * (total - 1) + place.location.lng) / total,
      }
    } else {
      clusters.push({ center: { ...place.location }, items: [place] })
    }
  })

  return clusters
}

function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const toRad = (value: number) => (value * Math.PI) / 180
  const R = 6371
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)

  const haversine =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2)
  const c = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
  return R * c
}

const DARK_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#263c3f" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6b9a76" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#38414e" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#212a37" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9ca5b3" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#746855" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1f2835" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#f3d19c" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#2f3948" }],
  },
  {
    featureType: "transit.station",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#17263c" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#515c6d" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#17263c" }],
  },
]
