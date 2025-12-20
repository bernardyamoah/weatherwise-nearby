"use client";

import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Square, Volume2 } from "lucide-react";
import { useCallback, useRef, useState } from "react";

interface AudioPlayerProps {
  text: string;
}

async function fetchTTS(text: string) {
  const response = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Failed to generate speech");
  }
  return data.audioContent;
}

export function AudioPlayer({ text }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const ttsMutation = useMutation({
    mutationFn: fetchTTS,
    onSuccess: async (audioContent) => {
      const audioSrc = `data:audio/mp3;base64,${audioContent}`;
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(audioSrc);
      audioRef.current = audio;
      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => setIsPlaying(false);
      await audio.play();
      setIsPlaying(true);
    },
    onError: (err) => {
      console.error("TTS error:", err);
    },
  });

  const handlePlay = useCallback(() => {
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      return;
    }

    ttsMutation.mutate(text);
  }, [text, isPlaying, ttsMutation]);

  const isLoading = ttsMutation.isPending;

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8"
      onClick={handlePlay}
      disabled={isLoading}
      aria-label={isPlaying ? "Stop" : "Listen"}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isPlaying ? (
        <Square className="w-4 h-4" />
      ) : (
        <Volume2 className="w-4 h-4" />
      )}
    </Button>
  );
}
