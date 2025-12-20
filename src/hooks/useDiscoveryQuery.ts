import { DiscoveryResponse } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";

async function fetchDiscovery(lat: number, lng: number, keyword?: string | null): Promise<DiscoveryResponse> {
  const url = new URL("/api/discover", window.location.origin)
  url.searchParams.set("lat", lat.toString())
  url.searchParams.set("lng", lng.toString())
  if (keyword) url.searchParams.set("q", keyword)

  const response = await fetch(url.toString());
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to fetch recommendations");
  }

  return data;
}

export function useDiscoveryQuery(lat: number | null, lng: number | null, keyword?: string | null) {
  return useQuery({
    queryKey: ["discovery", lat, lng, keyword],
    queryFn: () => fetchDiscovery(lat!, lng!, keyword),
    enabled: lat !== null && lng !== null,
    staleTime: 5 * 60 * 1000, 
    gcTime: 10 * 60 * 1000,
  });
}
