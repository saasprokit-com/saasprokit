import {
  DEFAULT_DESIGN_CONFIG,
  DESIGN_CONFIG_STORAGE_KEY,
} from "./design-config";

/**
 * Inline script that applies stored design config to `<html>` BEFORE the
 * browser paints. Mount in `<head>` (root layout). Safe with CSP — pass the
 * nonce so it's allowlisted.
 *
 * Security: This script body is entirely hardcoded from build-time constants.
 * No user input is interpolated. The only runtime input is localStorage which
 * is same-origin and parsed with JSON.parse (safe). The setAttribute and
 * setProperty calls only write to the document element's style/attributes.
 */
export const DesignConfigScript = ({ nonce }: { nonce?: string }) => {
  const storageKey = JSON.stringify(DESIGN_CONFIG_STORAGE_KEY);
  const defaults = JSON.stringify(DEFAULT_DESIGN_CONFIG);

  // Font CSS mapping (must stay in sync with FONT_CSS_MAP in design-config.tsx)
  const fontMap = JSON.stringify({
    "geist-mono": "var(--font-geist-mono)",
    "geist-sans": "var(--font-geist-sans)",
    inter: "'Inter', ui-sans-serif, system-ui, sans-serif",
    "dm-sans": "'DM Sans', ui-sans-serif, system-ui, sans-serif",
    "plus-jakarta": "'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif",
  });

  const body = `try{var d=${defaults};var f=${fontMap};var r=localStorage.getItem(${storageKey});var c=r?JSON.parse(r):d;var e=document.documentElement;if(c.baseColor&&c.baseColor!=="neutral")e.setAttribute("data-base-color",c.baseColor);if(c.headingFont&&f[c.headingFont])e.style.setProperty("--heading-font",f[c.headingFont]);if(c.bodyFont&&f[c.bodyFont])e.style.setProperty("--font-sans",f[c.bodyFont]);if(typeof c.radius==="number")e.style.setProperty("--radius",c.radius+"rem");}catch(x){}`;

  // biome-ignore lint/security/noDangerouslySetInnerHtml: hardcoded script from build-time constants only, no user input
  return <script dangerouslySetInnerHTML={{ __html: body }} nonce={nonce} />;
};
