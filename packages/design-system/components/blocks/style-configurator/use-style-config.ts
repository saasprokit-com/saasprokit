"use client";

import { useCallback, useMemo, useState } from "react";
import {
  ACCENT_COLORS,
  BASE_COLORS,
  DEFAULT_CONFIG,
  DENSITY_OPTIONS,
  FONT_OPTIONS,
  type StyleConfig,
} from "./color-presets";

/**
 * Hook that manages style configuration state and computes CSS variables.
 *
 * Usage:
 *   const { config, setConfig, updateConfig, cssVars, reset } = useStyleConfig();
 *   <div style={cssVars}>{children}</div>
 */
export function useStyleConfig(isDark = false) {
  const [config, setConfig] = useState<StyleConfig>(DEFAULT_CONFIG);

  const updateConfig = useCallback((partial: Partial<StyleConfig>) => {
    setConfig((prev) => ({ ...prev, ...partial }));
  }, []);

  const reset = useCallback(() => {
    setConfig(DEFAULT_CONFIG);
  }, []);

  const cssVars = useMemo(() => {
    const mode = isDark ? "dark" : "light";
    const vars: Record<string, string> = {};

    // Base color variables
    const baseVars = BASE_COLORS[config.baseColor][mode];
    for (const [key, value] of Object.entries(baseVars)) {
      vars[key] = value;
    }

    // Accent color variables (override primary + ring)
    const accentVars = ACCENT_COLORS[config.accent][mode];
    for (const [key, value] of Object.entries(accentVars)) {
      vars[key] = value;
    }

    // Radius
    vars["--radius"] = `${config.radius}rem`;

    // Font
    const fontOption = FONT_OPTIONS[config.font];
    if (fontOption) {
      vars["--font-sans"] = fontOption.family;
    }

    // Density (scale padding/spacing)
    const density = DENSITY_OPTIONS.find((d) => d.value === config.density);
    if (density) {
      vars["--density-scale"] = String(density.scale);
    }

    return vars;
  }, [config, isDark]);

  return { config, setConfig, updateConfig, cssVars, reset };
}
