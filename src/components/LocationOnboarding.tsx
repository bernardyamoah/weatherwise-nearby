import { useEffect, useMemo, useState } from "react"
import { AlertCircle, Check, Compass, MapPin, RefreshCw, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

type GeoState = {
  latitude: number | null
  longitude: number | null
  locationLabel: string | null
  error: string | null
  loading: boolean
  source: "auto" | "manual"
  refresh: () => void
  setManualLocation: (lat: number, lng: number, label?: string | null) => void
}

interface LocationOnboardingProps {
  geo: GeoState
  compact?: boolean
}

export function LocationOnboarding({ geo, compact = false }: LocationOnboardingProps) {
  const [query, setQuery] = useState("")
  const [latInput, setLatInput] = useState("")
  const [lngInput, setLngInput] = useState("")
  const [manualError, setManualError] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<Array<{ description: string; placeId: string }>>([])
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [lookupMessage, setLookupMessage] = useState<string | null>(null)
  const [lastAppliedQuery, setLastAppliedQuery] = useState("")
  const offline = useMemo(() => typeof navigator !== "undefined" && !navigator.onLine, [])

  useEffect(() => {
    if (query.trim().length < 3) {
      setSuggestions([])
      return
    }

    const controller = new AbortController()
    const timeout = setTimeout(async () => {
      try {
        setIsFetchingSuggestions(true)
        const res = await fetch(`/api/autocomplete?input=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        })
        const data = await res.json()
        if (res.ok) {
          setSuggestions(
            data.predictions?.map((p: { description: string; place_id: string }) => ({
              description: p.description,
              placeId: p.place_id,
            })) || []
          )
        }
      } catch (err) {
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          console.warn("[Autocomplete]", err)
        }
      } finally {
        setIsFetchingSuggestions(false)
      }
    }, 250)

    return () => {
      controller.abort()
      clearTimeout(timeout)
    }
  }, [query])

  useEffect(() => {
    if (query.trim().length < 3 || query === lastAppliedQuery || offline) return

    const controller = new AbortController()
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch("/api/geocode", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
          signal: controller.signal,
        })
        const data = await res.json()
        if (res.ok) {
          const label = `${data.name}${data.address ? ` · ${data.address}` : ""}`
          setLatInput(data.lat.toFixed(4))
          setLngInput(data.lng.toFixed(4))
          geo.setManualLocation(data.lat, data.lng, label)
          setLookupMessage(label)
          setLastAppliedQuery(query)
        }
      } catch (err) {
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          console.warn("[Geocode-auto]", err)
        }
      }
    }, 600)

    return () => {
      controller.abort()
      clearTimeout(timeout)
    }
  }, [query, lastAppliedQuery, geo, offline])

  const handleManualSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const lat = Number(latInput)
    const lng = Number(lngInput)

    if (
      Number.isNaN(lat) ||
      Number.isNaN(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      setManualError("Enter valid coordinates (lat: -90 to 90, lng: -180 to 180)")
      return
    }

    setManualError(null)
    geo.setManualLocation(lat, lng)
    setLookupMessage("Manual coordinates applied")
  }

  const handleSuggestionClick = (description: string) => {
    setQuery(description)
    setSuggestions([])
  }

  const handlePlaceSearch = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!query.trim()) return
    setIsSearching(true)
    setManualError(null)
    setLookupMessage(null)
    try {
      const response = await fetch("/api/geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Location search failed")
      }
      const label = `${data.name}${data.address ? ` · ${data.address}` : ""}`
      setLatInput(data.lat.toFixed(4))
      setLngInput(data.lng.toFixed(4))
      geo.setManualLocation(data.lat, data.lng, label)
      setLookupMessage(label)
      setLastAppliedQuery(query)
    } catch (err) {
      setManualError(err instanceof Error ? err.message : "Failed to search location")
    } finally {
      setIsSearching(false)
    }
  }

  const content = (
    <div className="flex flex-col gap-4" aria-live="polite">
      <div className="flex items-center justify-between gap-2">
        <div className="space-y-1">
          <CardTitle className="text-base">Use your location</CardTitle>
          <CardDescription>
            One tap to detect your position or set a manual fallback.
          </CardDescription>
          {geo.locationLabel && (
            <p className="text-xs text-muted-foreground">
              Current: <span className="font-medium text-foreground">{geo.locationLabel}</span>
            </p>
          )}
        </div>
        <Badge variant="secondary" className="flex items-center gap-1">
          <Compass className="h-3.5 w-3.5" />
          {geo.source === "manual" ? "Manual" : "Auto"}
        </Badge>
      </div>

      {geo.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Location blocked</AlertTitle>
          <AlertDescription>{geo.error}</AlertDescription>
        </Alert>
      )}

      {offline && !geo.error && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Offline</AlertTitle>
          <AlertDescription>Reconnect to request your live location.</AlertDescription>
        </Alert>
      )}

      {geo.loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Skeleton className="h-9 w-40" />
          <span>Requesting location permission...</span>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={geo.refresh} aria-label="Use my current location">
            <RefreshCw className="mr-2 h-4 w-4" /> Use my location
          </Button>
          {geo.latitude !== null && geo.longitude !== null && (
            <Badge variant="outline" className="flex items-center gap-1 text-xs">
              <Check className="h-3.5 w-3.5" />
              {geo.latitude.toFixed(3)}, {geo.longitude.toFixed(3)}
            </Badge>
          )}
        </div>
      )}

      <Dialog>
        <DialogTrigger asChild>
          <Button variant="secondary" className="gap-2">
            <MapPin className="h-4 w-4" /> Set coordinates manually
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set coordinates</DialogTitle>
          </DialogHeader>
          <form className="grid gap-3" onSubmit={handleManualSubmit}>
            <div className="space-y-1">
              <Label htmlFor="lat-input">Latitude</Label>
              <Input
                id="lat-input"
                inputMode="decimal"
                placeholder="e.g. 37.7749"
                value={latInput}
                onChange={(e) => setLatInput(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="lng-input">Longitude</Label>
              <Input
                id="lng-input"
                inputMode="decimal"
                placeholder="e.g. -122.4194"
                value={lngInput}
                onChange={(e) => setLngInput(e.target.value)}
              />
            </div>
            {manualError && <p className="text-sm text-destructive">{manualError}</p>}
            <Button type="submit" variant="secondary" className="w-full" aria-label="Apply manual location">
              Save location
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <form className="grid gap-3 md:grid-cols-[2fr_auto] md:items-end" onSubmit={handlePlaceSearch}>
        <div className="space-y-1">
          <Label htmlFor="place-search">Search a place or city</Label>
          <Input
            id="place-search"
            placeholder="e.g. Paris, Times Square, Tokyo"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {suggestions.length > 0 && (
            <div className="mt-2 rounded-md border border-border/60 bg-background/80 text-sm shadow-sm">
              {suggestions.map((s) => (
                <button
                  key={s.placeId}
                  type="button"
                  className="flex w-full items-start gap-2 border-b border-border/40 px-3 py-2 text-left last:border-b-0 hover:bg-muted/70"
                  onClick={() => handleSuggestionClick(s.description)}
                >
                  <Search className="mt-0.5 h-4 w-4 text-primary" />
                  <span className="leading-tight">{s.description}</span>
                </button>
              ))}
              {(isFetchingSuggestions) && (
                <div className="px-3 py-2 text-xs text-muted-foreground">Searching…</div>
              )}
            </div>
          )}
        </div>
        <Button type="submit" variant="outline" className="w-full md:w-auto" disabled={isSearching}>
          <Search className="mr-2 h-4 w-4" />
          {isSearching ? "Searching..." : "Set from search"}
        </Button>
        {lookupMessage && (
          <p className="md:col-span-2 text-sm text-muted-foreground">Located: {lookupMessage}</p>
        )}
      </form>
    </div>
  )

  if (compact) {
    return <div className="rounded-xl border bg-muted/30 p-4">{content}</div>
  }

  return (
    <Card className="border-muted/60 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Location onboarding</CardTitle>
        <CardDescription>Start with a quick permission tap or use manual coordinates.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">{content}</CardContent>
    </Card>
  )
}
