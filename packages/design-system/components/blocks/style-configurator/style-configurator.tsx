"use client";

import { cn } from "@repo/design-system/lib/utils";
import { Moon, RotateCcw, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import {
  ACCENT_COLORS,
  type AccentColorName,
  type BaseColorName,
  type DensityValue,
  FONT_OPTIONS,
  type FontName,
  RADIUS_OPTIONS,
  type StyleConfig,
} from "./color-presets";

const BASE_COLOR_PREVIEWS: Record<BaseColorName, string> = {
  neutral: "#737373",
  slate: "#64748b",
  zinc: "#71717a",
  stone: "#78716c",
  gray: "#6b7280",
};

interface StyleConfiguratorProps {
  config: StyleConfig;
  onUpdate: (partial: Partial<StyleConfig>) => void;
  onReset: () => void;
  className?: string;
}

export function StyleConfigurator({
  config,
  onUpdate,
  onReset,
  className,
}: StyleConfiguratorProps) {
  const { theme, setTheme } = useTheme();

  // Load Google Fonts dynamically when font changes
  useEffect(() => {
    const fontOption = FONT_OPTIONS[config.font];
    if (!fontOption?.googleUrl) {
      return;
    }

    const id = `gfont-${config.font}`;
    if (document.getElementById(id)) {
      return;
    }

    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = fontOption.googleUrl;
    document.head.appendChild(link);
  }, [config.font]);

  return (
    <div
      className={cn(
        "flex flex-col gap-6 bg-foreground/5 p-6 text-sm",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="font-semibold text-base">Customize</span>
        <button
          className="flex items-center gap-1.5 text-muted-foreground text-xs transition-colors hover:text-foreground"
          onClick={onReset}
          type="button"
        >
          <RotateCcw className="h-3 w-3" />
          Reset
        </button>
      </div>

      {/* Base Color */}
      <div>
        <p className="mb-2 font-medium text-muted-foreground text-xs uppercase tracking-wider">
          Base Color
        </p>
        <div className="flex gap-2">
          {(
            ["neutral", "slate", "zinc", "stone", "gray"] as BaseColorName[]
          ).map((color) => (
            <button
              className={cn(
                "h-8 w-8 border transition-all",
                config.baseColor === color
                  ? "border-foreground"
                  : "border-transparent opacity-50 hover:opacity-100"
              )}
              key={color}
              onClick={() => onUpdate({ baseColor: color })}
              style={{ backgroundColor: BASE_COLOR_PREVIEWS[color] }}
              title={color}
              type="button"
            />
          ))}
        </div>
      </div>

      {/* Accent Color */}
      <div>
        <p className="mb-2 font-medium text-muted-foreground text-xs uppercase tracking-wider">
          Accent Color
        </p>
        <div className="flex gap-2">
          {(Object.keys(ACCENT_COLORS) as AccentColorName[]).map((color) => (
            <button
              className={cn(
                "h-8 w-8 border transition-all",
                config.accent === color
                  ? "border-foreground"
                  : "border-transparent opacity-50 hover:opacity-100"
              )}
              key={color}
              onClick={() => onUpdate({ accent: color })}
              style={{ backgroundColor: ACCENT_COLORS[color].preview }}
              title={color}
              type="button"
            />
          ))}
        </div>
      </div>

      {/* Radius */}
      <div>
        <p className="mb-2 font-medium text-muted-foreground text-xs uppercase tracking-wider">
          Radius
        </p>
        <div className="flex gap-1.5">
          {RADIUS_OPTIONS.map((opt) => (
            <button
              className={cn(
                "flex h-8 w-12 items-center justify-center border text-xs transition-colors",
                config.radius === opt.value
                  ? "border-foreground bg-foreground text-background"
                  : "border-border hover:border-foreground"
              )}
              key={opt.value}
              onClick={() => onUpdate({ radius: opt.value })}
              type="button"
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Font */}
      <div>
        <p className="mb-2 font-medium text-muted-foreground text-xs uppercase tracking-wider">
          Font
        </p>
        <Select
          onValueChange={(value) => onUpdate({ font: value as FontName })}
          value={config.font}
        >
          <SelectTrigger className="w-full" size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(FONT_OPTIONS) as FontName[]).map((font) => (
              <SelectItem key={font} value={font}>
                {FONT_OPTIONS[font].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Mode */}
      <div>
        <p className="mb-2 font-medium text-muted-foreground text-xs uppercase tracking-wider">
          Mode
        </p>
        <div className="flex gap-1.5">
          <button
            className={cn(
              "flex h-8 items-center gap-1.5 border px-3 text-xs transition-colors",
              theme === "light"
                ? "border-foreground bg-foreground text-background"
                : "border-border hover:border-foreground"
            )}
            onClick={() => setTheme("light")}
            type="button"
          >
            <Sun className="h-3.5 w-3.5" />
            Light
          </button>
          <button
            className={cn(
              "flex h-8 items-center gap-1.5 border px-3 text-xs transition-colors",
              theme === "dark"
                ? "border-foreground bg-foreground text-background"
                : "border-border hover:border-foreground"
            )}
            onClick={() => setTheme("dark")}
            type="button"
          >
            <Moon className="h-3.5 w-3.5" />
            Dark
          </button>
        </div>
      </div>

      {/* Density */}
      <div>
        <p className="mb-2 font-medium text-muted-foreground text-xs uppercase tracking-wider">
          Density
        </p>
        <div className="flex gap-1.5">
          {(["compact", "comfortable", "spacious"] as DensityValue[]).map(
            (d) => (
              <button
                className={cn(
                  "flex h-8 items-center border px-3 text-xs capitalize transition-colors",
                  config.density === d
                    ? "border-foreground bg-foreground text-background"
                    : "border-border hover:border-foreground"
                )}
                key={d}
                onClick={() => onUpdate({ density: d })}
                type="button"
              >
                {d}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
