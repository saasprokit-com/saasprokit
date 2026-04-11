/**
 * Client-safe internationalization exports.
 * No "server-only" guard — safe to import from "use client" components.
 */

import type en from "./dictionaries/en.json";
import languine from "./languine.json" with { type: "json" };

export const DEFAULT_LOCALE = languine.locale.source;

export const locales = [
  languine.locale.source,
  ...languine.locale.targets,
] as const;

export type Dictionary = typeof en;
export type ActionErrorMessages = Dictionary["errors"]["action"];
