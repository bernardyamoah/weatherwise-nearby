import { create } from "zustand";
import { persist } from "zustand/middleware";

interface FavoritesState {
  favorites: string[]; // List of place IDs
  toggleFavorite: (placeId: string) => void;
  isFavorite: (placeId: string) => boolean;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],
      toggleFavorite: (placeId: string) => {
        const { favorites } = get();
        const isFav = favorites.includes(placeId);
        if (isFav) {
          set({ favorites: favorites.filter((id) => id !== placeId) });
        } else {
          set({ favorites: [...favorites, placeId] });
        }
      },
      isFavorite: (placeId: string) => get().favorites.includes(placeId),
    }),
    {
      name: "weatherwise-favorites",
    }
  )
);
