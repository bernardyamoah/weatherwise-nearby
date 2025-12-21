import { env } from "./env";
import { Weather, WeatherCategory } from "./types";

type MaybeNumber = number | { value?: number } | undefined | null;

function toNumber(value: MaybeNumber): number | null {
  if (typeof value === "number") return value;
  if (value && typeof value === "object" && typeof value.value === "number") return value.value;
  return null;
}

function categorizeWeatherFromConditions(
  temperature: number,
  conditionCode?: string,
  precipitationChance?: number | null
): WeatherCategory {
  const code = (conditionCode || "").toLowerCase();
  const precip = precipitationChance ?? 0;

  if (code.includes("rain") || code.includes("storm") || precip >= 60) return "rainy";
  if (temperature >= 30) return "hot";
  if (temperature <= 10) return "cold";
  return "clear";
}

function getWeatherEmoji(category: WeatherCategory): string {
  switch (category) {
    case "rainy":
      return "🌧️";
    case "hot":
      return "☀️";
    case "cold":
      return "❄️";
    case "clear":
      return "🌤️";
  }
}

interface WeatherPoint {
  temperature?: MaybeNumber;
  apparentTemperature?: MaybeNumber;
  feelsLikeTemperature?: MaybeNumber;
  humidity?: MaybeNumber;
  relativeHumidity?: MaybeNumber;
  windSpeed?: MaybeNumber;
  precipitationChance?: MaybeNumber;
  precipitationProbability?: MaybeNumber;
  conditionCode?: string;
  weatherCode?: string;
  conditions?: string;
  description?: string;
  icon?: string;
  pressure?: MaybeNumber;
  barometricPressure?: MaybeNumber;
  visibility?: MaybeNumber;
  visibilityDistance?: MaybeNumber;
  cloudCover?: MaybeNumber;
  dewPoint?: MaybeNumber;
  sunriseTime?: string;
  sunrise?: string;
  sunsetTime?: string;
  sunset?: string;
  startTime?: string;
  forecastStartTime?: string;
  time?: string;
  validTime?: string;
  maxTemperature?: MaybeNumber;
  minTemperature?: MaybeNumber;
  date?: string;
  forecastDate?: string;
}

interface GoogleWeatherResponse {
  currentWeather?: WeatherPoint;
  hourlyForecast?: WeatherPoint[];
  dailyForecast?: WeatherPoint[];
}

async function fetchGoogleWeather(lat: number, lng: number): Promise<Weather> {
  const url = new URL("https://weather.googleapis.com/v1/weather:lookup");
  url.searchParams.set("location", `${lat},${lng}`);
  url.searchParams.set("units", "metric");
  url.searchParams.set("language", "en");
  url.searchParams.set("key", env.PLACES_API_KEY);

  console.log("[Weather] Fetching Google Weather for", lat, lng);

  const response = await fetch(url.toString(), { cache: "no-store" });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google Weather API error: ${response.status} - ${error}`);
  }

  const data: GoogleWeatherResponse = await response.json();
  const current: WeatherPoint = data.currentWeather || {};

  const temperature = Math.round(toNumber(current.temperature) ?? 0);
  const apparentTemperature = Math.round(
    toNumber(current.apparentTemperature ?? current.feelsLikeTemperature) ?? temperature
  );
  const humidity = Math.round(toNumber(current.humidity ?? current.relativeHumidity) ?? 0);
  const windSpeed = Math.round(toNumber(current.windSpeed) ?? 0);
  const precipChance = toNumber(current.precipitationChance ?? current.precipitationProbability);
  const conditionCode: string | undefined = current.conditionCode || current.weatherCode;
  const description: string = current.conditions || current.description || conditionCode || "Weather";
  const icon = (current.icon || conditionCode || "clear").toString();
  const pressureHpa = toNumber(current.pressure || current.barometricPressure);
  const visibilityRaw = toNumber(current.visibility || current.visibilityDistance);
  const visibilityKm = visibilityRaw === null ? null : Math.round((visibilityRaw > 1000 ? visibilityRaw / 1000 : visibilityRaw) * 10) / 10;
  const cloudCover = toNumber(current.cloudCover);
  const dewPoint = toNumber(current.dewPoint);
  const sunrise = current.sunriseTime || current.sunrise || undefined;
  const sunset = current.sunsetTime || current.sunset || undefined;

  const hourly = (data.hourlyForecast || []).map((entry) => {
    const time =
      entry.startTime || entry.forecastStartTime || entry.time || entry.validTime || new Date().toISOString();
    return {
      time,
      temperature2m: toNumber(entry.temperature) ?? temperature,
      precipitationProbability: toNumber(entry.precipitationChance ?? entry.precipitationProbability) ?? 0,
    };
  });

  const daily = (data.dailyForecast || []).map((entry) => {
    const time = entry.date || entry.forecastDate || entry.startTime || new Date().toISOString();
    return {
      time,
      temperature2mMax: toNumber(entry.maxTemperature) ?? null,
      temperature2mMin: toNumber(entry.minTemperature) ?? null,
      weatherCode: entry.conditionCode || entry.weatherCode || "0",
    };
  });

  const category = categorizeWeatherFromConditions(temperature, conditionCode, precipChance);

  return {
    temperature,
    condition: description,
    category,
    description,
    icon,
    hourly: hourly.length
      ? {
          time: hourly.map((h) => h.time),
          temperature2m: hourly.map((h) => h.temperature2m),
          precipitationProbability: hourly.map((h) => h.precipitationProbability),
        }
      : undefined,
    daily: daily.length
      ? {
          time: daily.map((d) => d.time),
          temperature2mMax: daily.map((d) => d.temperature2mMax),
          temperature2mMin: daily.map((d) => d.temperature2mMin),
          weatherCode: daily.map((d) => Number(d.weatherCode) || 0),
        }
      : undefined,
    current: {
      relativeHumidity2m: humidity,
      apparentTemperature,
      windSpeed10m: windSpeed,
      uvIndex: toNumber(current.uvIndex) ?? 0,
      pressureHpa: pressureHpa ?? undefined,
      visibilityKm: visibilityKm ?? undefined,
      cloudCover: cloudCover ?? undefined,
      dewPoint: dewPoint ?? undefined,
      precipitationProbability: precipChance ?? undefined,
      sunrise,
      sunset,
    },
  };
}

// Open-Meteo fallback (existing behavior)
async function fetchOpenMeteoWeather(lat: number, lng: number): Promise<Weather> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", lat.toString());
  url.searchParams.set("longitude", lng.toString());
  url.searchParams.set(
    "current",
    "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,surface_pressure,cloud_cover"
  );
  url.searchParams.set(
    "hourly",
    "temperature_2m,precipitation_probability"
  );
  url.searchParams.set(
    "daily",
    "weather_code,temperature_2m_max,temperature_2m_min"
  );
  url.searchParams.set("timezone", "auto");

  console.log("[Weather] Fetching Open-Meteo for", lat, lng);

  const response = await fetch(url.toString(), {
    next: { revalidate: 1200 }, // Cache for 20 minutes
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Weather API error: ${response.status} - ${error}`);
  }

  const data = await response.json();

  const weatherCode = data.current.weather_code;
  const temperature = data.current.temperature_2m;

  return {
    temperature: Math.round(temperature),
    condition: getOpenMeteoCondition(weatherCode),
    category: categorizeOpenMeteoWeather(weatherCode, temperature),
    description: getOpenMeteoDescription(weatherCode),
    icon: weatherCode.toString(),
    hourly: {
      time: data.hourly.time,
      temperature2m: data.hourly.temperature_2m,
      precipitationProbability: data.hourly.precipitation_probability,
    },
    daily: {
      time: data.daily.time,
      temperature2mMax: data.daily.temperature_2m_max,
      temperature2mMin: data.daily.temperature_2m_min,
      weatherCode: data.daily.weather_code,
    },
    current: {
      relativeHumidity2m: data.current.relative_humidity_2m,
      apparentTemperature: Math.round(data.current.apparent_temperature),
      windSpeed10m: data.current.wind_speed_10m,
      uvIndex: 0,
      pressureHpa: toNumber(data.current.surface_pressure) ?? undefined,
      cloudCover: toNumber(data.current.cloud_cover) ?? undefined,
      precipitationProbability: data.hourly?.precipitation_probability?.[0] ?? undefined,
    },
  };
}

// Open-Meteo helpers (unchanged semantics)
function categorizeOpenMeteoWeather(weatherCode: number, temperature: number): WeatherCategory {
  if (
    (weatherCode >= 51 && weatherCode <= 67) ||
    (weatherCode >= 80 && weatherCode <= 82) ||
    (weatherCode >= 95 && weatherCode <= 99)
  ) {
    return "rainy";
  }

  if (
    (weatherCode >= 71 && weatherCode <= 77) ||
    (weatherCode >= 85 && weatherCode <= 86)
  ) {
    return "cold";
  }

  if (temperature >= 30) {
    return "hot";
  }

  if (temperature <= 10) {
    return "cold";
  }

  return "clear";
}

function getOpenMeteoDescription(weatherCode: number): string {
  const descriptions: Record<number, string> = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Foggy",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    56: "Light freezing drizzle",
    57: "Dense freezing drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    66: "Light freezing rain",
    67: "Heavy freezing rain",
    71: "Slight snow",
    73: "Moderate snow",
    75: "Heavy snow",
    77: "Snow grains",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    85: "Slight snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail",
  };

  return descriptions[weatherCode] || "Unknown";
}

function getOpenMeteoCondition(weatherCode: number): string {
  if (weatherCode === 0) return "Clear";
  if (weatherCode >= 1 && weatherCode <= 3) return "Cloudy";
  if (weatherCode >= 45 && weatherCode <= 48) return "Fog";
  if (weatherCode >= 51 && weatherCode <= 57) return "Drizzle";
  if (weatherCode >= 61 && weatherCode <= 67) return "Rain";
  if (weatherCode >= 71 && weatherCode <= 77) return "Snow";
  if (weatherCode >= 80 && weatherCode <= 82) return "Showers";
  if (weatherCode >= 85 && weatherCode <= 86) return "Snow Showers";
  if (weatherCode >= 95 && weatherCode <= 99) return "Thunderstorm";
  return "Unknown";
}

export async function fetchWeather(lat: number, lng: number): Promise<Weather> {
  try {
    return await fetchGoogleWeather(lat, lng);
  } catch (error) {
    console.warn("[Weather] Google Weather failed, falling back to Open-Meteo", error);
    return fetchOpenMeteoWeather(lat, lng);
  }
}

export { getWeatherEmoji };
