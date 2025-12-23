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
   OPENAI_API_KEY=your_openai_api_key
   UNSPLASH_ACCESS_KEY=your_unsplash_access_key   # used for weather hero imagery
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

## API Keys

- **Weather**: Uses Open-Meteo (no key required)
- **PLACES_API_KEY**: Get from [Google Cloud Console](https://console.cloud.google.com/) (Places API, reverse geocoding)
- **GOOGLE_TTS_API_KEY**: Get from [Google Cloud Console](https://console.cloud.google.com/) (Text-to-Speech API)
- **OPENAI_API_KEY**: Used for AI insights/briefings/packing advice and to refine weather imagery queries
- **UNSPLASH_ACCESS_KEY**: Used server-side to fetch atmospheric hero images that match the current weather and time of day

## Features

- 📍 Location-based recommendations
- 🌦️ Weather-aware place ranking with Open-Meteo data
- 🕐 Timezone-aware open/closed status
- 🗣️ Text-to-Speech for accessibility
- 🔎 Global search header to jump to places or filter recommendations
- 🖼️ Weather cards use Unsplash imagery tailored to current conditions and time of day
