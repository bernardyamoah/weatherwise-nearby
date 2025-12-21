import { create } from "zustand";
import { persist } from "zustand/middleware";

interface FavoritesState {
  favorites: string[]; // List of place IDs
  toggleFavorite: (placeId: string) => void;
  isFavorite: (placeId: string) => boolean;
  pinned: string[];
  togglePin: (placeId: string) => void;
  isPinned: (placeId: string) => boolean;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],
      pinned: [],
      toggleFavorite: (placeId: string) => {
        const { favorites } = get();
        const isFav = favorites.includes(placeId);
        if (isFav) {
          set({
            favorites: favorites.filter((id) => id !== placeId),
            pinned: get().pinned.filter((id) => id !== placeId),
          });
        } else {
          set({ favorites: [...favorites, placeId] });
        }
      },
      isFavorite: (placeId: string) => get().favorites.includes(placeId),
      togglePin: (placeId: string) => {
        const { pinned, favorites } = get();
        if (!favorites.includes(placeId)) return;

        const isAlreadyPinned = pinned.includes(placeId);
        if (isAlreadyPinned) {
          set({ pinned: pinned.filter((id) => id !== placeId) });
        } else {
          set({ pinned: [placeId, ...pinned] });
        }
      },
      isPinned: (placeId: string) => get().pinned.includes(placeId),
    }),
    {
      name: "weatherwise-favorites",
    }
  )
);
