"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/design-system/components/ui/select";
import { cn } from "@repo/design-system/lib/utils";
import {
  BASE_COLORS,
  type BaseColor,
  BODY_FONTS,
  type BodyFont,
  HEADING_FONTS,
  type HeadingFont,
  RADIUS_VALUES,
  useDesignConfig,
} from "@repo/design-system/providers/design-config";
import { Moon, RotateCcw, Sun } from "lucide-react";
import { useTheme } from "next-themes";

const FONT_LABELS: Record<HeadingFont | BodyFont, string> = {
  "geist-mono": "Geist Mono",
  "geist-sans": "Geist Sans",
  inter: "Inter",
  "dm-sans": "DM Sans",
  "plus-jakarta": "Plus Jakarta",
};

const COLOR_LABELS: Record<BaseColor, string> = {
  neutral: "Neutral",
  slate: "Slate",
  stone: "Stone",
  zinc: "Zinc",
  gray: "Gray",
};

const COLOR_SWATCHES: Record<BaseColor, string> = {
  neutral: "oklch(0.145 0 0)",
  slate: "oklch(0.129 0.042 264.695)",
  stone: "oklch(0.147 0.004 49.25)",
  zinc: "oklch(0.141 0.005 285.823)",
  gray: "oklch(0.13 0.028 261.692)",
};

interface StyleConfiguratorProps {
  className?: string;
}

export function StyleConfigurator({ className }: StyleConfiguratorProps) {
  const { config, setConfig, resetConfig, configString } = useDesignConfig();
  const { theme, setTheme } = useTheme();

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      {/* Base Color */}
      <ConfigRow label="Base color">
        <div className="flex gap-2">
          {BASE_COLORS.map((color) => (
            <button
              aria-label={COLOR_LABELS[color]}
              aria-pressed={config.baseColor === color}
              className={cn(
                "h-6 w-6 rounded-full border-2 transition-all",
                config.baseColor === color
                  ? "scale-110 border-foreground"
                  : "border-transparent hover:border-foreground/30"
              )}
              key={color}
              onClick={() => setConfig({ baseColor: color })}
              style={{ backgroundColor: COLOR_SWATCHES[color] }}
              title={COLOR_LABELS[color]}
              type="button"
            />
          ))}
        </div>
      </ConfigRow>

      {/* Theme */}
      <ConfigRow label="Theme">
        <div className="flex gap-1.5">
          <ThemeButton
            active={theme === "light"}
            icon={<Sun className="h-3.5 w-3.5" />}
            label="light"
            onClick={() => setTheme("light")}
          />
          <ThemeButton
            active={theme === "dark"}
            icon={<Moon className="h-3.5 w-3.5" />}
            label="dark"
            onClick={() => setTheme("dark")}
          />
        </div>
      </ConfigRow>

      {/* Heading Font */}
      <ConfigRow label="Heading font">
        <Select
          onValueChange={(v) => setConfig({ headingFont: v as HeadingFont })}
          value={config.headingFont}
        >
          <SelectTrigger className="h-8 w-[160px] font-mono text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {HEADING_FONTS.map((font) => (
              <SelectItem className="font-mono text-xs" key={font} value={font}>
                {FONT_LABELS[font]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </ConfigRow>

      {/* Body Font */}
      <ConfigRow label="Body font">
        <Select
          onValueChange={(v) => setConfig({ bodyFont: v as BodyFont })}
          value={config.bodyFont}
        >
          <SelectTrigger className="h-8 w-[160px] font-mono text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {BODY_FONTS.map((font) => (
              <SelectItem className="font-mono text-xs" key={font} value={font}>
                {FONT_LABELS[font]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </ConfigRow>

      {/* Radius */}
      <ConfigRow label="Radius">
        <div className="flex gap-1">
          {RADIUS_VALUES.map((r) => (
            <button
              className={cn(
                "h-8 min-w-[40px] border px-2 font-mono text-xs transition-colors",
                config.radius === r
                  ? "border-foreground bg-foreground text-background"
                  : "border-border hover:border-foreground/50"
              )}
              key={r}
              onClick={() => setConfig({ radius: r })}
              type="button"
            >
              {r}
            </button>
          ))}
        </div>
      </ConfigRow>

      {/* Config string + actions */}
      <div className="flex items-center justify-between gap-4 border-border border-t pt-4">
        <span className="font-mono text-[11px] text-muted-foreground">
          {configString}
        </span>
        <button
          className="inline-flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground"
          onClick={resetConfig}
          type="button"
        >
          <RotateCcw className="h-3 w-3" />
          reset
        </button>
      </div>
    </div>
  );
}

function ConfigRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="font-mono text-[11px] text-muted-foreground uppercase tracking-[0.05em]">
        {label}
      </span>
      {children}
    </div>
  );
}

function ThemeButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={cn(
        "flex h-8 items-center gap-1.5 border px-3 font-mono text-xs transition-colors",
        active
          ? "border-foreground bg-foreground text-background"
          : "border-border hover:border-foreground/50"
      )}
      onClick={onClick}
      type="button"
    >
      {icon}
      {label}
    </button>
  );
}
