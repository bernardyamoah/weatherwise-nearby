import { calculateDistance } from "./distance";
import { isPlaceOpen } from "./open-now";
import { getPlaceCategory, isIndoorPlace } from "./places";
import { Place, PlaceLocation, ScoredPlace, WeatherCategory } from "./types";

interface RankingInput {
  places: Place[];
  userLocation: PlaceLocation;
  weatherCategory: WeatherCategory;
  timezoneId: string;
}

/**
 * Score and rank places based on weather, distance, and open status
 */
export function rankPlaces(input: RankingInput): ScoredPlace[] {
  const { places, userLocation, weatherCategory, timezoneId } = input;

  const scoredPlaces: ScoredPlace[] = places.map((place) => {
    const distance = calculateDistance(userLocation, place.location);
    const isOpen = isPlaceOpen(place.openingHours, timezoneId);
    const score = calculateScore(place, distance, isOpen, weatherCategory);
    const explanation = generateExplanation(place, isOpen, weatherCategory);

    return {
      ...place,
      score,
      distance,
      isOpen,
      explanation,
    };
  });

  // Sort by score descending, then by distance ascending
  scoredPlaces.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.distance - b.distance;
  });

  return scoredPlaces;
}

/**
 * Deterministic scoring function
 * Base: 50 points
 * Weather match: +30 points
 * Open status: +20 points (closed: -20 points)
 * Distance penalty: -5 points per km (max -25)
 */
function calculateScore(
  place: Place,
  distance: number,
  isOpen: boolean,
  weatherCategory: WeatherCategory
): number {
  let score = 50;

  // Weather-based scoring
  const placeType = getPlaceCategory(place.types);
  const weatherScore = getWeatherMatchScore(placeType, weatherCategory);
  score += weatherScore;

  // Open/closed scoring
  if (isOpen) {
    score += 20;
  } else {
    score -= 20;
  }

  // Distance penalty (max 25 points off for 5+ km)
  const distancePenalty = Math.min(distance * 5, 25);
  score -= distancePenalty;

  // Rating bonus (if available)
  if (place.rating) {
    score += (place.rating - 3) * 5; // +/- 10 points based on rating
  }

  return Math.round(score);
}

/**
 * Score based on weather-place type match
 */
function getWeatherMatchScore(
  placeType: "indoor" | "outdoor" | "mixed",
  weatherCategory: WeatherCategory
): number {
  switch (weatherCategory) {
    case "rainy":
      // Rainy → prioritize indoor
      if (placeType === "indoor") return 30;
      if (placeType === "mixed") return 10;
      return -10; // outdoor penalized

    case "hot":
      // Hot → prioritize indoor (AC) or shaded
      if (placeType === "indoor") return 25;
      if (placeType === "mixed") return 10;
      return 0;

    case "cold":
      // Cold → prioritize indoor (warm)
      if (placeType === "indoor") return 25;
      if (placeType === "mixed") return 10;
      return -5;

    case "clear":
      // Clear → prioritize outdoor
      if (placeType === "outdoor") return 30;
      if (placeType === "mixed") return 15;
      return 5; // indoor still okay
  }
}

/**
 * Generate human-readable explanation for recommendation
 */
function generateExplanation(
  place: Place,
  isOpen: boolean,
  weatherCategory: WeatherCategory
): string {
  const isIndoor = isIndoorPlace(place.types);
  const openStatus = isOpen ? "open" : "currently closed";

  const weatherReasons: Record<WeatherCategory, string> = {
    rainy: isIndoor
      ? "Great choice for rainy weather — stay dry indoors"
      : "Outdoor spot, but might want to wait for better weather",
    hot: isIndoor
      ? "Perfect for hot weather — enjoy the AC"
      : "Outdoor location — consider visiting in cooler hours",
    cold: isIndoor
      ? "Warm indoor spot for cold weather"
      : "Outdoor spot — bundle up!",
    clear: isIndoor
      ? "Nice indoor option for clear weather"
      : "Great outdoor spot for clear weather",
  };

  const reason = weatherReasons[weatherCategory];
  const status = isOpen ? "" : ` (${openStatus})`;

  return `${reason}${status}`;
}
