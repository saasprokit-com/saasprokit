import type { DesignPreset } from "@repo/design-system/providers/design-preset";

export interface PresetMeta {
  label: string;
  description: string;
  swatches: readonly [string, string, string];
}

/**
 * UI metadata for the design presets. The actual colors are authored as CSS
 * in `packages/design-system/styles/design-presets.css` — the swatches here
 * are sRGB approximations of the OKLch values, used only for the small
 * preview dots in the configurator picker.
 */
export const PRESET_META: Record<DesignPreset, PresetMeta> = {
  minimal: {
    label: "Minimal",
    description: "Neutral · Blue · Geist",
    swatches: ["#ffffff", "#171717", "#3b82f6"],
  },
  warm: {
    label: "Warm",
    description: "Stone · Amber · DM Sans",
    swatches: ["#fafaf9", "#292524", "#f59e0b"],
  },
  crisp: {
    label: "Crisp",
    description: "Gray · Green · Inter",
    swatches: ["#ffffff", "#111827", "#22c55e"],
  },
  bold: {
    label: "Bold",
    description: "Zinc · Red · Jakarta",
    swatches: ["#ffffff", "#18181b", "#ef4444"],
  },
};
