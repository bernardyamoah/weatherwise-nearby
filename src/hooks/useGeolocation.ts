"use client";

import { useGeolocationStore } from "@/store/geolocation";
import { useCallback, useEffect } from "react";

export function useGeolocation() {
  const {
    latitude,
    longitude,
    error,
    loading,
    source,
    setLocation,
    setManualLocation,
    setError,
    setLoading,
  } = useGeolocationStore();

  const getPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation(position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        let errorMessage = "Failed to get location";

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location permission denied. Please enable location access.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out.";
            break;
        }

        setError(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  }, [setLocation, setError, setLoading]);

  useEffect(() => {
    getPosition();
  }, [getPosition]);

  return {
    latitude,
    longitude,
    error,
    loading,
    source,
    refresh: getPosition,
    setManualLocation,
  };
}
