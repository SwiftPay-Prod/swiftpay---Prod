"use client";

import { Button } from "@heroui/react";
import { Icon } from '@/components/ui/icon';
import { Moon02Icon, Sun02Icon } from '@hugeicons/core-free-icons';
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <Button
      variant="ghost"
      size="sm"
      isIconOnly
      aria-label="Toggle theme"
      onPress={() => setTheme(isDark ? "light" : "dark")}
    >
      <span className="dark:hidden"><Icon icon={Moon02Icon} className="w-6 h-6" /></span>
      <span className="hidden dark:inline"><Icon icon={Sun02Icon} className="w-6 h-6" /></span>
    </Button>
  );
}

