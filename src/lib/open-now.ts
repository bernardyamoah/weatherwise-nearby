import { getLocalDayOfWeek, getLocalHour } from "./timezone";
import { OpeningHours } from "./types";

/**
 * Determine if a place is currently open
 * Uses timezone-aware logic with safe fallback
 */
export function isPlaceOpen(
  openingHours: OpeningHours | undefined,
  timezoneId: string
): boolean {
  // Safe fallback: if no data, assume might be open
  if (!openingHours) {
    return true;
  }

  // Use the openNow flag if available (most reliable)
  if (typeof openingHours.openNow === "boolean") {
    return openingHours.openNow;
  }

  // Fallback: calculate from periods
  if (!openingHours.periods || openingHours.periods.length === 0) {
    return true; // No data, assume open
  }

  const currentDay = getLocalDayOfWeek(timezoneId);
  const currentHour = getLocalHour(timezoneId);
  const currentMinutes = new Date().getMinutes();
  const currentTimeMinutes = currentHour * 60 + currentMinutes;

  for (const period of openingHours.periods) {
    // Check if this period applies to today
    if (period.open.day === currentDay) {
      const openTimeMinutes = period.open.hour * 60 + period.open.minute;
      const closeTimeMinutes = period.close.hour * 60 + period.close.minute;

      // Handle overnight periods (close time on next day)
      if (closeTimeMinutes < openTimeMinutes) {
        // Open past midnight
        if (currentTimeMinutes >= openTimeMinutes || currentTimeMinutes < closeTimeMinutes) {
          return true;
        }
      } else {
        // Normal same-day hours
        if (currentTimeMinutes >= openTimeMinutes && currentTimeMinutes < closeTimeMinutes) {
          return true;
        }
      }
    }

    // Check for overnight from previous day
    const previousDay = (currentDay + 6) % 7;
    if (period.open.day === previousDay && period.close.day === currentDay) {
      const closeTimeMinutes = period.close.hour * 60 + period.close.minute;
      if (currentTimeMinutes < closeTimeMinutes) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Get open status text for display
 */
export function getOpenStatusText(isOpen: boolean): string {
  return isOpen ? "Open now" : "Closed";
}
