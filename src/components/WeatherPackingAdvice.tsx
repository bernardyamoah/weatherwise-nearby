"use client";

import { useQuery } from "@tanstack/react-query";
import { Backpack, Loader2, ShieldCheck, Sparkles } from "lucide-react";

import { Weather } from "@/lib/types";

import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface WeatherPackingAdviceProps {
  weather: Weather;
  localTime: string;
  timezone: string;
}

async function fetchPackingAdvice(payload: WeatherPackingAdviceProps) {
  const response = await fetch("/api/ai/packing", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch packing advice");
  }

  return response.json() as Promise<{
    summary: string;
    packingList: string[];
    safety: string;
  }>;
}

export function WeatherPackingAdvice(props: WeatherPackingAdviceProps) {
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: [
      "packing-advice",
      props.weather.temperature,
      props.weather.category,
      props.localTime,
    ],
    queryFn: () => fetchPackingAdvice(props),
    staleTime: 20 * 60 * 1000,
  });

  return (
    <Card className="border-primary/30 bg-primary/5 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
          <Sparkles className="h-4 w-4" />
          <span>AI Packing Guide</span>
        </div>
        <CardTitle className="text-base">Weather-smart essentials</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="space-y-2">
            <div className="h-4 w-40 rounded bg-muted animate-pulse" />
            <div className="h-3 w-64 rounded bg-muted animate-pulse" />
            <div className="grid gap-2 sm:grid-cols-2">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="h-10 rounded-md border border-dashed border-muted animate-pulse" />
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-between rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <span>Unable to load AI packing tips.</span>
            <Button variant="ghost" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : (
          <>
            <p className="text-sm text-foreground/90 leading-relaxed">{data?.summary}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {data?.packingList?.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-2 rounded-md border border-border/60 bg-background/80 px-3 py-2 text-sm"
                >
                  <Backpack className="h-4 w-4 text-primary" />
                  <span className="text-foreground/90">{item}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-xs text-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span>{isFetching && !isLoading ? "Updating for current weather..." : data?.safety}</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
