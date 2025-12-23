import { z } from "zod";

const envSchema = z.object({
  // Weather API: Open-Meteo is free and doesn't require an API key
  PLACES_API_KEY: z.string().min(1, "PLACES_API_KEY is required"),
  GOOGLE_TTS_API_KEY: z.string().min(1, "GOOGLE_TTS_API_KEY is required"),
  OPENAI_API_KEY: z.string().min(1, "OPENAI_API_KEY is required"),
  UNSPLASH_ACCESS_KEY: z.string().optional(), // For atmospheric weather photography
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const result = envSchema.safeParse({
    PLACES_API_KEY: process.env.PLACES_API_KEY,
    GOOGLE_TTS_API_KEY: process.env.GOOGLE_TTS_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    UNSPLASH_ACCESS_KEY: process.env.UNSPLASH_ACCESS_KEY,
  });

  if (!result.success) {
    console.error("❌ Invalid environment variables:");
    console.error(result.error.flatten().fieldErrors);
    throw new Error("Invalid environment variables");
  }

  return result.data;
}

export const env = validateEnv();
