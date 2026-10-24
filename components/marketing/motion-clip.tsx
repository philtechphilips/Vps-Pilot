"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

const REDUCED = "(prefers-reduced-motion: reduce)";

function subscribeReduced(listener: () => void) {
  const media = window.matchMedia(REDUCED);
  media.addEventListener("change", listener);
  return () => media.removeEventListener("change", listener);
}

function useReducedMotion() {
  return useSyncExternalStore(subscribeReduced, () => window.matchMedia(REDUCED).matches, () => false);
}

/**
 * A motion clip made with HyperFrames (sources in motion/<name>, rendered into
 * public/motion by `npm run build` there), in the current theme.
 *
 * It plays once when it scrolls into view and holds its last frame. With
 * reduced motion, or for a theme switched to after it played, it shows the
 * finished frame instead.
 */
export function MotionClip({ name, width, height, className }: { name: string; width: number; height: number; className?: string }) {
  const theme = useTheme();
  const reduced = useReducedMotion();
  const [played, setPlayed] = useState(false);
  const ref = useRef<HTMLVideoElement>(null);
  const still = reduced || played;
  const src = `/motion/${name}-${theme}`;

  useEffect(() => {
    const video = ref.current;
    if (!video || still) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        setPlayed(true);
        // Autoplay can be refused (e.g. low-power mode); the poster then shows the finished frame.
        video.play().catch(() => {});
      },
      { threshold: 0.45 },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [still, theme]);

  return (
    <video
      key={theme}
      ref={ref}
      width={width}
      height={height}
      muted
      playsInline
      preload={still ? "none" : "metadata"}
      poster={still ? `${src}.webp` : undefined}
      aria-hidden="true"
      className={cn("block h-auto w-full", className)}
    >
      <source src={`${src}.webm`} type="video/webm" />
      <source src={`${src}.mp4`} type="video/mp4" />
    </video>
  );
}
