# WeatherWise Nearby

A mobile-first web app that recommends nearby places based on your location, current weather, and time of day.

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file with the following variables:
   ```
   PLACES_API_KEY=your_google_places_api_key
   GOOGLE_TTS_API_KEY=your_google_tts_api_key
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

## API Keys

- **Weather**: Uses Google Weather API via the same `PLACES_API_KEY` (falls back to Open-Meteo if Google is unavailable)
- **PLACES_API_KEY**: Get from [Google Cloud Console](https://console.cloud.google.com/) (Places/Weather APIs)
- **GOOGLE_TTS_API_KEY**: Get from [Google Cloud Console](https://console.cloud.google.com/) (Text-to-Speech API)

## Features

- 📍 Location-based recommendations
- 🌦️ Weather-aware place ranking
- 🕐 Timezone-aware open/closed status
- 🗣️ Text-to-Speech for accessibility
