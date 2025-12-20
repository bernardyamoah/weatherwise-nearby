import { Weather, WeatherCategory } from "./types";


// Open-Meteo WMO Weather interpretation codes
// https://open-meteo.com/en/docs
function categorizeWeather(
  weatherCode: number,
  temperature: number
): WeatherCategory {
  // WMO codes:
  // 0: Clear sky
  // 1-3: Mainly clear, partly cloudy, overcast
  // 45, 48: Fog
  // 51-57: Drizzle
  // 61-67: Rain
  // 71-77: Snow
  // 80-82: Rain showers
  // 85-86: Snow showers
  // 95-99: Thunderstorm

  // Rain/drizzle/thunderstorm
  if (
    (weatherCode >= 51 && weatherCode <= 67) ||
    (weatherCode >= 80 && weatherCode <= 82) ||
    (weatherCode >= 95 && weatherCode <= 99)
  ) {
    return "rainy";
  }

  // Snow
  if (
    (weatherCode >= 71 && weatherCode <= 77) ||
    (weatherCode >= 85 && weatherCode <= 86)
  ) {
    return "cold";
  }

  // Temperature-based for clear/cloudy conditions
  if (temperature >= 30) {
    return "hot";
  }

  if (temperature <= 10) {
    return "cold";
  }

  return "clear";
}

function getWeatherDescription(weatherCode: number): string {
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

function getWeatherCondition(weatherCode: number): string {
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

function getWeatherIcon(weatherCode: number): string {
  // Return weather code as string - maps to /icons/{code}.png
  return weatherCode.toString();
}

export async function fetchWeather(lat: number, lng: number): Promise<Weather> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", lat.toString());
  url.searchParams.set("longitude", lng.toString());
  url.searchParams.set(
    "current",
    "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m"
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

  console.log("[Weather] Fetching for", lat, lng);

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
    condition: getWeatherCondition(weatherCode),
    category: categorizeWeather(weatherCode, temperature),
    description: getWeatherDescription(weatherCode),
    icon: getWeatherIcon(weatherCode),
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
    },
  };
}

export function getWeatherEmoji(category: WeatherCategory): string {
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
