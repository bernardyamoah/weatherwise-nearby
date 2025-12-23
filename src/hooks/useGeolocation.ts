"use client";

import { useGeolocationStore } from "@/store/geolocation";
import { useCallback, useEffect, useRef } from "react";

export function useGeolocation() {
  useGeolocationLabel();
  const {
    latitude,
    longitude,
    autoLatitude,
    autoLongitude,
    locationLabel,
    error,
    loading,
    source,
    setLocation,
    setManualLocation,
    setLocationLabel,
    setError,
    setLoading,
  } = useGeolocationStore();

  const getPosition = useCallback(() => {
    console.log("[Geolocation] getPosition called");
    
    if (typeof window === "undefined") {
      console.log("[Geolocation] Window is undefined (SSR)");
      return;
    }

    console.log("[Geolocation] Secure context:", window.isSecureContext);
    if (!window.isSecureContext) {
      setError("Automatic location requires HTTPS or localhost. Switch to a secure context or set a location manually.");
      setLoading(false);
      return;
    }

    console.log("[Geolocation] Navigator.geolocation available:", !!navigator.geolocation);
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setLoading(false);
      return;
    }

    console.log("[Geolocation] Starting location request...");
    setLoading(true);
    setError(null); // Clear previous errors

    const timeoutId = window.setTimeout(() => {
      console.log("[Geolocation] Custom timeout triggered");
      setError("Location request timed out. Please enable location access or set coordinates manually.");
      setLoading(false);
    }, 12000);

    try {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log("[Geolocation] Success:", position.coords);
          window.clearTimeout(timeoutId);
          setLocation(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.log("[Geolocation] Error:", error.code, error.message);
          window.clearTimeout(timeoutId);
          let errorMessage = "Failed to get location";

          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Location permission denied. Please enable location access in your browser settings.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location information unavailable. Make sure location services are enabled on your device.";
              break;
            case error.TIMEOUT:
              errorMessage = "Location request timed out. Please try again.";
              break;
          }

          setError(errorMessage);
          setLoading(false);
        },
        {
          enableHighAccuracy: false, // Try false first - faster and more reliable
          timeout: 10000,
          maximumAge: 0, // Try 0 to force fresh location
        }
      );
    } catch (err) {
      console.error("[Geolocation] Catch block error:", err);
      window.clearTimeout(timeoutId);
      setError("Unable to access location. Check browser permissions or try manual coordinates.");
      setLoading(false);
    }
  }, [setLocation, setError, setLoading]);

  useEffect(() => {
    console.log("[Geolocation] Effect running");
    
    if (typeof window === "undefined") return;

    let cancelled = false;
    let permissionStatus: PermissionStatus | null = null;

    const handlePermissionChange = () => {
      console.log("[Geolocation] Permission changed:", permissionStatus?.state);
      if (cancelled || !permissionStatus) return;
      if (permissionStatus.state === "granted") {
        getPosition();
      } else if (permissionStatus.state === "denied") {
        setError("Location access is blocked. Enable it in browser settings or set coordinates manually.");
        setLoading(false);
      }
    };

    const checkPermissionAndLocate = async () => {
      if (navigator.permissions?.query) {
        try {
          permissionStatus = await navigator.permissions.query({ name: "geolocation" as PermissionName });
          console.log("[Geolocation] Permission state:", permissionStatus.state);
          
          if (cancelled) return;

          permissionStatus.addEventListener("change", handlePermissionChange);

          if (permissionStatus.state === "denied") {
            setError("Location access is blocked. Enable it in browser settings or set coordinates manually.");
            setLoading(false);
            return;
          }
        } catch (err) {
          console.warn("[Geolocation permissions query failed]", err);
        }
      }

      if (!cancelled) {
        getPosition();
      }
    };

    checkPermissionAndLocate();

    return () => {
      console.log("[Geolocation] Cleanup");
      cancelled = true;
      permissionStatus?.removeEventListener("change", handlePermissionChange);
    };
  }, [getPosition, setError, setLoading]);

  return {
    latitude,
    longitude,
    autoLatitude,
    autoLongitude,
    locationLabel,
    error,
    loading,
    source,
    refresh: getPosition,
    setManualLocation,
  };
}

// Reverse geocode to attach human-friendly label
export function useGeolocationLabel() {
  const { latitude, longitude, autoLatitude, autoLongitude, locationLabel, setLocationLabel } = useGeolocationStore();
  const lastLookupRef = useRef<string | null>(null);

  useEffect(() => {
    const lat = latitude ?? autoLatitude;
    const lng = longitude ?? autoLongitude;
    if (lat === null || lng === null) return;
    const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
    if (locationLabel && lastLookupRef.current === key) return;

    const controller = new AbortController();
    const load = async () => {
      try {
        const res = await fetch(`/api/reverse-geocode?lat=${lat}&lng=${lng}`, { signal: controller.signal });
        if (!res.ok) return;
        const data = await res.json();
        setLocationLabel(data.label || data.formatted || null);
        lastLookupRef.current = key;
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          console.warn("[Geolocation] reverse geocode failed", error);
        }
      }
    };

    load();
    return () => controller.abort();
  }, [latitude, longitude, autoLatitude, autoLongitude, locationLabel, setLocationLabel]);
}
