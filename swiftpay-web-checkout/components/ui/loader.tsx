"use client";

import { motion } from "framer-motion";
import { useSyncExternalStore } from "react";

interface LoaderProps {
  className?: string;
  dotSize?: "sm" | "md" | "lg";
  color?: "accent" | "white" | "gray" | "auto";
}

const dotSizes = {
  sm: "h-2 w-2",
  md: "h-3 w-3",
  lg: "h-4 w-4",
};

const dotColors = {
  accent: "bg-accent",
  white: "bg-white",
  gray: "bg-zinc-400",
  // 'auto' is handled separately
};

function useSystemTheme() {
  const subscribe = (callback: () => void) => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => callback();
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  };

  const getSnapshot = () => window.matchMedia("(prefers-color-scheme: dark)").matches;
  const getServerSnapshot = () => true;

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function Loader({
  className = "",
  dotSize = "md",
  color = "accent",
}: LoaderProps) {
  const isDark = useSystemTheme();
  
  // For 'auto', use white on dark theme and gray on light theme
  const resolvedColor = color === "auto" 
    ? (isDark ? "white" : "gray") 
    : color;

  return (
    <div className={`flex items-center justify-center gap-1.5 ${className}`}>
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className={`rounded-full ${dotSizes[dotSize]} ${dotColors[resolvedColor]}`}
          initial={{ x: 0 }}
          animate={{
            x: [0, 10, 0],
            opacity: [0.5, 1, 0.5],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.2,
          }}
        />
      ))}
    </div>
  );
}

export function FullPageLoader() {
  const _isDark = useSystemTheme();

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-background">
      <div className="flex flex-col items-center gap-6">
        <Loader dotSize="lg" color="auto" />
        <p className="text-sm animate-pulse text-muted-foreground">
          Carregando checkout...
        </p>
      </div>
    </div>
  );
}
