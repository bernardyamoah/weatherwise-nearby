import { create } from "zustand";

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  autoLatitude: number | null;
  autoLongitude: number | null;
  locationLabel: string | null;
  error: string | null;
  loading: boolean;
  source: "auto" | "manual";
  setLocation: (lat: number, lng: number, label?: string | null, source?: "auto" | "manual") => void;
  setManualLocation: (lat: number, lng: number, label?: string | null) => void;
  setLocationLabel: (label: string | null) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useGeolocationStore = create<GeolocationState>((set) => ({
  latitude: null,
  longitude: null,
  autoLatitude: null,
  autoLongitude: null,
  locationLabel: null,
  error: null,
  loading: true,
  source: "auto",

  setLocation: (latitude, longitude, label = null, source = "auto") =>
    set({
      latitude,
      longitude,
      autoLatitude: source === "auto" ? latitude : null,
      autoLongitude: source === "auto" ? longitude : null,
      locationLabel: label,
      error: null,
      loading: false,
      source,
    }),

  setManualLocation: (latitude, longitude, label = null) =>
    set((state) => ({
      latitude,
      longitude,
      autoLatitude: state.autoLatitude,
      autoLongitude: state.autoLongitude,
      locationLabel: label ?? state.locationLabel,
      error: null,
      loading: false,
      source: "manual",
    })),

  setLocationLabel: (label) => set({ locationLabel: label }),

  setError: (error) =>
    set({ error, latitude: null, longitude: null, locationLabel: null, loading: false }),

  setLoading: (loading) => set({ loading }),

  reset: () =>
    set({
      latitude: null,
      longitude: null,
      autoLatitude: null,
      autoLongitude: null,
      locationLabel: null,
      error: null,
      loading: true,
      source: "auto",
    }),
}));
