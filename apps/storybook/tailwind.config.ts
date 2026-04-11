import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./stories/**/*.{js,ts,jsx,tsx}",
    "./.storybook/**/*.{js,ts,jsx,tsx}",
    "../../packages/design-system/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {},
  plugins: [],
} satisfies Config;
