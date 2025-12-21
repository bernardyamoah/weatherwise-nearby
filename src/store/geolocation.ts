import { create } from "zustand";

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  loading: boolean;
  source: "auto" | "manual";
  setLocation: (lat: number, lng: number, source?: "auto" | "manual") => void;
  setManualLocation: (lat: number, lng: number) => void;
  setError: (error: string) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useGeolocationStore = create<GeolocationState>((set) => ({
  latitude: null,
  longitude: null,
  error: null,
  loading: true,
  source: "auto",

  setLocation: (latitude, longitude, source = "auto") =>
    set({ latitude, longitude, error: null, loading: false, source }),

  setManualLocation: (latitude, longitude) =>
    set({ latitude, longitude, error: null, loading: false, source: "manual" }),

  setError: (error) =>
    set({ error, latitude: null, longitude: null, loading: false }),

  setLoading: (loading) => set({ loading }),

  reset: () =>
    set({ latitude: null, longitude: null, error: null, loading: true, source: "auto" }),
}));
