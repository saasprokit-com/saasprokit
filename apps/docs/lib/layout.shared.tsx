import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

export const siteName = process.env.NEXT_PUBLIC_APP_NAME ?? "Docs";

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: siteName,
    },
  };
}
