"use client";

import { Card, CardContent } from "@/components/ui/card";
import { DiscoveryResponse } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Sparkles } from "lucide-react";

interface WeatherBriefingProps {
  data: DiscoveryResponse;
}

async function fetchBriefing(data: DiscoveryResponse) {
  const response = await fetch("/api/briefing", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      weather: data.weather,
      recommendations: data.recommendations,
      localTime: data.localTime,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch briefing");
  }

  const result = await response.json();
  return result.briefing;
}

export function WeatherBriefing({ data }: WeatherBriefingProps) {
  const { data: briefing, isLoading, error } = useQuery({
    queryKey: ["briefing", data.weather.temperature, data.weather.condition, data.localTime],
    queryFn: () => fetchBriefing(data),
    staleTime: 30 * 60 * 1000, // 30 mins
  });

  if (error) return null;

  return (
    <Card className="bg-gradient-to-br from-primary/10 via-background to-background border-primary/20 overflow-hidden relative group">
      <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
        <Sparkles className="w-12 h-12 text-primary" />
      </div>
      <CardContent className="p-4 md:p-6 flex items-start gap-4">
        <div className="bg-primary/20 p-2 rounded-lg shrink-0 mt-1">
          {isLoading ? (
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
          ) : (
            <Sparkles className="w-5 h-5 text-primary" />
          )}
        </div>
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-primary uppercase tracking-wider">AI Weather Briefing</h4>
          {isLoading ? (
            <div className="space-y-2 pt-1">
                <div className="h-3 w-[250px] bg-muted animate-pulse rounded" />
                <div className="h-3 w-[200px] bg-muted animate-pulse rounded" />
            </div>
          ) : (
            <p className="text-sm md:text-base text-foreground/90 leading-relaxed font-medium">
                {briefing}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
