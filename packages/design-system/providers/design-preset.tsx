"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export const DESIGN_PRESETS = ["minimal", "warm", "crisp", "bold"] as const;
export type DesignPreset = (typeof DESIGN_PRESETS)[number];

export const DEFAULT_DESIGN_PRESET: DesignPreset = "minimal";
export const DESIGN_STORAGE_KEY = "design-preset";
const DESIGN_ATTRIBUTE = "data-design";

interface DesignPresetContextValue {
  preset: DesignPreset;
  setPreset: (preset: DesignPreset) => void;
  presets: readonly DesignPreset[];
}

const DesignPresetContext = createContext<DesignPresetContextValue | null>(
  null
);

function isDesignPreset(value: string | null): value is DesignPreset {
  return (
    value !== null && (DESIGN_PRESETS as readonly string[]).includes(value)
  );
}

function readStoredPreset(): DesignPreset {
  if (typeof window === "undefined") {
    return DEFAULT_DESIGN_PRESET;
  }
  try {
    const raw = window.localStorage.getItem(DESIGN_STORAGE_KEY);
    return isDesignPreset(raw) ? raw : DEFAULT_DESIGN_PRESET;
  } catch {
    return DEFAULT_DESIGN_PRESET;
  }
}

/**
 * Applies the active design preset as `data-design` on `<html>` so the CSS
 * rules in `design-presets.css` take effect. Persists the selection to
 * localStorage so it survives reloads and navigation.
 *
 * Pair with `DesignPresetScript` in `<head>` to eliminate the first-paint
 * flash; the inline script applies the stored preset before React hydrates.
 */
export const DesignPresetProvider = ({ children }: { children: ReactNode }) => {
  const [preset, setPresetState] = useState<DesignPreset>(
    DEFAULT_DESIGN_PRESET
  );

  useEffect(() => {
    setPresetState(readStoredPreset());
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute(DESIGN_ATTRIBUTE, preset);
  }, [preset]);

  const setPreset = useCallback((next: DesignPreset) => {
    setPresetState(next);
    try {
      window.localStorage.setItem(DESIGN_STORAGE_KEY, next);
    } catch {
      // localStorage unavailable (private mode, quota) — state stays in memory
    }
  }, []);

  return (
    <DesignPresetContext.Provider
      value={{ preset, setPreset, presets: DESIGN_PRESETS }}
    >
      {children}
    </DesignPresetContext.Provider>
  );
};

export function useDesignPreset(): DesignPresetContextValue {
  const ctx = useContext(DesignPresetContext);
  if (!ctx) {
    throw new Error(
      "useDesignPreset must be used inside a DesignPresetProvider"
    );
  }
  return ctx;
}
