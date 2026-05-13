"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export const BASE_COLORS = [
  "neutral",
  "slate",
  "stone",
  "zinc",
  "gray",
] as const;
export type BaseColor = (typeof BASE_COLORS)[number];

export const HEADING_FONTS = [
  "geist-mono",
  "geist-sans",
  "inter",
  "dm-sans",
  "plus-jakarta",
] as const;
export type HeadingFont = (typeof HEADING_FONTS)[number];

export const BODY_FONTS = [
  "geist-sans",
  "inter",
  "dm-sans",
  "plus-jakarta",
] as const;
export type BodyFont = (typeof BODY_FONTS)[number];

export const RADIUS_VALUES = [0, 0.3, 0.5, 0.625, 0.75, 1.0] as const;
export type RadiusValue = (typeof RADIUS_VALUES)[number];

export interface DesignConfig {
  baseColor: BaseColor;
  headingFont: HeadingFont;
  bodyFont: BodyFont;
  radius: number;
}

export const DEFAULT_DESIGN_CONFIG: DesignConfig = {
  baseColor: "neutral",
  headingFont: "geist-mono",
  bodyFont: "geist-sans",
  radius: 0.625,
};

export const DESIGN_CONFIG_STORAGE_KEY = "design-config";

const FONT_CSS_MAP: Record<HeadingFont | BodyFont, string> = {
  "geist-mono": "var(--font-geist-mono)",
  "geist-sans": "var(--font-geist-sans)",
  inter: "'Inter', ui-sans-serif, system-ui, sans-serif",
  "dm-sans": "'DM Sans', ui-sans-serif, system-ui, sans-serif",
  "plus-jakarta": "'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif",
};

interface DesignConfigContextValue {
  config: DesignConfig;
  setConfig: (config: Partial<DesignConfig>) => void;
  resetConfig: () => void;
  configString: string;
}

const DesignConfigContext = createContext<DesignConfigContextValue | null>(
  null
);

function readStoredConfig(): DesignConfig {
  if (typeof window === "undefined") {
    return DEFAULT_DESIGN_CONFIG;
  }
  try {
    const raw = window.localStorage.getItem(DESIGN_CONFIG_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_DESIGN_CONFIG;
    }
    const parsed = JSON.parse(raw);
    return {
      baseColor: BASE_COLORS.includes(parsed.baseColor)
        ? parsed.baseColor
        : DEFAULT_DESIGN_CONFIG.baseColor,
      headingFont: HEADING_FONTS.includes(parsed.headingFont)
        ? parsed.headingFont
        : DEFAULT_DESIGN_CONFIG.headingFont,
      bodyFont: BODY_FONTS.includes(parsed.bodyFont)
        ? parsed.bodyFont
        : DEFAULT_DESIGN_CONFIG.bodyFont,
      radius:
        typeof parsed.radius === "number"
          ? parsed.radius
          : DEFAULT_DESIGN_CONFIG.radius,
    };
  } catch {
    return DEFAULT_DESIGN_CONFIG;
  }
}

function applyConfigToDOM(config: DesignConfig) {
  const el = document.documentElement;

  // Base color
  if (config.baseColor === "neutral") {
    el.removeAttribute("data-base-color");
  } else {
    el.setAttribute("data-base-color", config.baseColor);
  }

  // Heading font
  el.style.setProperty("--heading-font", FONT_CSS_MAP[config.headingFont]);

  // Body font
  el.style.setProperty("--font-sans", FONT_CSS_MAP[config.bodyFont]);

  // Radius
  el.style.setProperty("--radius", `${config.radius}rem`);
}

export const DesignConfigProvider = ({ children }: { children: ReactNode }) => {
  const [config, setConfigState] = useState<DesignConfig>(
    DEFAULT_DESIGN_CONFIG
  );

  useEffect(() => {
    const stored = readStoredConfig();
    setConfigState(stored);
    applyConfigToDOM(stored);
  }, []);

  useEffect(() => {
    applyConfigToDOM(config);
  }, [config]);

  const setConfig = useCallback((partial: Partial<DesignConfig>) => {
    setConfigState((prev) => {
      const next = { ...prev, ...partial };
      try {
        window.localStorage.setItem(
          DESIGN_CONFIG_STORAGE_KEY,
          JSON.stringify(next)
        );
      } catch {
        // localStorage unavailable
      }
      return next;
    });
  }, []);

  const resetConfig = useCallback(() => {
    setConfigState(DEFAULT_DESIGN_CONFIG);
    try {
      window.localStorage.removeItem(DESIGN_CONFIG_STORAGE_KEY);
    } catch {
      // localStorage unavailable
    }
  }, []);

  const configString = useMemo(
    () =>
      `${config.baseColor} · h:${config.headingFont} · f:${config.bodyFont} · r:${config.radius}`,
    [config]
  );

  return (
    <DesignConfigContext.Provider
      value={{ config, setConfig, resetConfig, configString }}
    >
      {children}
    </DesignConfigContext.Provider>
  );
};

export function useDesignConfig(): DesignConfigContextValue {
  const ctx = useContext(DesignConfigContext);
  if (!ctx) {
    throw new Error(
      "useDesignConfig must be used inside a DesignConfigProvider"
    );
  }
  return ctx;
}
