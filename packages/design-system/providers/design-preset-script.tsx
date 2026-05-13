import {
  DEFAULT_DESIGN_PRESET,
  DESIGN_PRESETS,
  DESIGN_STORAGE_KEY,
} from "./design-preset";

const DESIGN_ATTRIBUTE = "data-design";

/**
 * Inline script that applies the stored design preset to `<html>` BEFORE the
 * browser paints. Mount in `<head>` (root layout). Safe with CSP — pass the
 * nonce so it's allowlisted.
 *
 * The script body is hardcoded, contains no user input, and only reads from
 * localStorage + calls setAttribute.
 */
export const DesignPresetScript = ({ nonce }: { nonce?: string }) => {
  const storageKey = JSON.stringify(DESIGN_STORAGE_KEY);
  const presets = JSON.stringify(DESIGN_PRESETS);
  const attribute = JSON.stringify(DESIGN_ATTRIBUTE);
  const fallback = JSON.stringify(DEFAULT_DESIGN_PRESET);

  const body = `try{var p=localStorage.getItem(${storageKey});var v=${presets};document.documentElement.setAttribute(${attribute},v.indexOf(p)>-1?p:${fallback});}catch(e){}`;

  // biome-ignore lint/security/noDangerouslySetInnerHtml: hardcoded script, no user input
  return <script dangerouslySetInnerHTML={{ __html: body }} nonce={nonce} />;
};
