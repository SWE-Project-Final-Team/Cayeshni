"use client";

import { useTheme } from "@/components/theme-provider";

export function ThemeToggle({
  className = "",
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={`inline-flex items-center gap-sm rounded-full border border-outline-variant bg-surface-container-low px-md py-xs text-on-surface-variant transition-colors hover:bg-surface-container-high ${
        compact ? "px-sm" : ""
      } ${className}`}
    >
      <span className="material-symbols-outlined">
        {isDark ? "light_mode" : "dark_mode"}
      </span>
      {!compact && (
        <span className="font-label-sm text-label-sm">
          {isDark ? "Light mode" : "Dark mode"}
        </span>
      )}
    </button>
  );
}
