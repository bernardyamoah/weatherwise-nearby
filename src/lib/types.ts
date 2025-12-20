// Weather Types
export type WeatherCategory = "rainy" | "hot" | "cold" | "clear";

export interface Weather {
  temperature: number; // Celsius
  condition: string;
  category: WeatherCategory;
  description: string;
  icon: string;
  hourly?: HourlyForecast;
  daily?: DailyForecast;
  current?: CurrentWeather;
}

export interface HourlyForecast {
  time: string[];
  temperature2m: number[];
  precipitationProbability: number[];
}

export interface DailyForecast {
  time: string[];
  temperature2mMax: number[];
  temperature2mMin: number[];
  weatherCode: number[];
}

export interface CurrentWeather {
  relativeHumidity2m: number;
  apparentTemperature: number;
  windSpeed10m: number;
  uvIndex: number;
}

// Place Types
export interface PlaceLocation {
  lat: number;
  lng: number;
}

export interface OpeningHours {
  openNow: boolean;
  periods?: {
    open: { day: number; hour: number; minute: number };
    close: { day: number; hour: number; minute: number };
  }[];
}

export interface Place {
  id: string;
  name: string;
  types: string[];
  location: PlaceLocation;
  openingHours?: OpeningHours;
  vicinity?: string;
  rating?: number;
  photoUrl?: string;
}

// Recommendation Types
export interface ScoredPlace extends Place {
  score: number;
  distance: number; // kilometers
  isOpen: boolean;
  explanation: string;
}

export interface DiscoveryResponse {
  weather: Weather;
  localTime: string;
  timezone: string;
  recommendations: ScoredPlace[];
}

// Timezone Types
export interface TimezoneInfo {
  timezoneId: string;
  localTime: string; // ISO string
}
