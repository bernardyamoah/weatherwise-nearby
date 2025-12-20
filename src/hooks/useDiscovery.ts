"use client";

import { DiscoveryResponse } from "@/lib/types";
import { useCallback, useState } from "react";

interface UseDiscoveryReturn {
  data: DiscoveryResponse | null;
  loading: boolean;
  error: string | null;
  fetch: (lat: number, lng: number) => Promise<void>;
}

export function useDiscovery(): UseDiscoveryReturn {
  const [data, setData] = useState<DiscoveryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDiscovery = useCallback(async (lat: number, lng: number) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/discover?lat=${lat}&lng=${lng}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch recommendations");
      }

      setData(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    data,
    loading,
    error,
    fetch: fetchDiscovery,
  };
}
